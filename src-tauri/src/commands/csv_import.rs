use crate::commands::bitcoin_transaction::create_bitcoin_transaction;
use crate::models::bitcoin_transaction::{
    BitcoinTransaction, CreateBitcoinTransactionRequest, TransactionType,
};
use chrono::{DateTime, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct CsvPreview {
    format: String,
    sample_records: Vec<serde_json::Value>,
    total_records: usize,
    headers_found_at_line: usize,
}

#[derive(Debug, Deserialize)]
struct CoinbaseRecord {
    #[serde(rename = "Timestamp")]
    timestamp: String,
    #[serde(rename = "Transaction Type")]
    transaction_type: String,
    #[serde(rename = "Asset")]
    asset: String,
    #[serde(rename = "Quantity Transacted")]
    quantity_transacted: String,
    #[serde(rename = "Price at Transaction")]
    price_at_transaction: String,
    #[serde(rename = "Subtotal")]
    subtotal: String,
    #[serde(rename = "Total (inclusive of fees and/or spread)")]
    total_inclusive: String,
    #[serde(rename = "Fees and/or Spread")]
    fees_and_spread: String,
    #[serde(rename = "Notes")]
    notes: String,
}

#[derive(Debug, Deserialize)]
struct RiverRecord {
    #[serde(rename = "Date")]
    date: String,
    #[serde(rename = "Type")]
    transaction_type: String,
    #[serde(rename = "Amount (BTC)")]
    amount_btc: String,
    #[serde(rename = "Amount (USD)")]
    amount_usd: String,
    #[serde(rename = "Fee (BTC)")]
    fee_btc: String,
    #[serde(rename = "Fee (USD)")]
    fee_usd: String,
    #[serde(rename = "Total (USD)")]
    total_usd: String,
    #[serde(rename = "Description")]
    description: String,
}

#[derive(Debug)]
enum CsvFormat {
    Coinbase,
    River,
}

fn detect_csv_format(content: &str) -> Result<CsvFormat, String> {
    let lines: Vec<&str> = content.lines().collect();
    if lines.is_empty() {
        return Err("Empty CSV file".to_string());
    }

    // Search through multiple lines to find the header (like analyze_csv_file does)
    for (i, line) in lines.iter().enumerate() {
        println!("Line {}: {}", i, line);

        if line.contains("Timestamp") && line.contains("Transaction Type") {
            println!("Found Coinbase format at line {}", i);
            return Ok(CsvFormat::Coinbase);
        } else if line.contains("Date") && line.contains("Type") && line.contains("Amount (BTC)") {
            println!("Found River format at line {}", i);
            return Ok(CsvFormat::River);
        }
    }

    Err("Unrecognized CSV format. Expected Coinbase or River format.".to_string())
}

fn parse_coinbase_timestamp(timestamp_str: &str) -> Result<DateTime<Utc>, String> {
    // Try RFC3339 format first: "2024-01-15T10:30:45Z"
    if let Ok(dt) = DateTime::parse_from_rfc3339(timestamp_str) {
        return Ok(dt.with_timezone(&Utc));
    }

    // Try Coinbase export format: "2025-10-10 21:28:40 UTC"
    if let Ok(dt) =
        NaiveDateTime::parse_from_str(timestamp_str.trim_end_matches(" UTC"), "%Y-%m-%d %H:%M:%S")
    {
        return Ok(dt.and_utc());
    }

    Err(format!(
        "Failed to parse Coinbase timestamp '{}': unsupported format",
        timestamp_str
    ))
}

fn parse_river_timestamp(date_str: &str) -> Result<DateTime<Utc>, String> {
    // River format: "2024-01-15 10:30:45"
    NaiveDateTime::parse_from_str(date_str, "%Y-%m-%d %H:%M:%S")
        .map(|dt| dt.and_utc())
        .map_err(|e| format!("Failed to parse River timestamp '{}': {}", date_str, e))
}

fn btc_to_sats(btc_str: &str) -> Result<i64, String> {
    let btc: f64 = btc_str
        .parse()
        .map_err(|e| format!("Failed to parse BTC amount '{}': {}", btc_str, e))?;
    Ok((btc * 100_000_000.0).round() as i64)
}

fn usd_to_cents(usd_str: &str) -> Result<i64, String> {
    let cleaned = usd_str.replace("$", "").replace(",", "");
    let usd: f64 = cleaned
        .parse()
        .map_err(|e| format!("Failed to parse USD amount '{}': {}", usd_str, e))?;
    Ok((usd * 100.0).round() as i64)
}

// TODO: update this:
// - first, lets strip everythign that is not BTC (where asset !== "BTC")
// - then lets group all the transactions by type (buy, sell, fee/withdrawal) taking into account the platform (coinbase/advanced)
// - then for each group, we need to group the transactions by timestamp (within 60 seconds) and create a new txn object
// - then we need to add the buys/sells/fees to the db

// Next steps: generate a coinbase csv with buy/sell in both regualr and advanced platforms
async fn process_coinbase_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<BitcoinTransaction>, String> {
    // Find the header line first (same logic as analyze_csv_file)
    let lines: Vec<&str> = content.lines().collect();
    let mut headers_line = 0;

    for (i, line) in lines.iter().enumerate() {
        if line.contains("Timestamp") && line.contains("Transaction Type") {
            headers_line = i;
            break;
        }
    }

    // Create CSV content starting from the header line
    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());
    let mut events = Vec::new();
    let mut grouped_transactions: HashMap<String, Vec<CoinbaseRecord>> = HashMap::new();

    // First pass: group transactions by timestamp (within 60 seconds)
    for result in reader.deserialize() {
        let record: CoinbaseRecord =
            result.map_err(|e| format!("Failed to parse CSV record: {}", e))?;

        if record.asset != "BTC" {
            continue; // Skip non-Bitcoin transactions
        }

        let timestamp = parse_coinbase_timestamp(&record.timestamp)?;
        let timestamp_key = timestamp.timestamp().to_string();

        grouped_transactions
            .entry(timestamp_key)
            .or_insert_with(Vec::new)
            .push(record);
    }

    // Second pass: process grouped transactions
    for (_, group) in grouped_transactions {
        let mut buy_records = Vec::new();
        let mut fee_records = Vec::new();

        for record in group {
            match record.transaction_type.as_str() {
                "Buy" => buy_records.push(record),
                "Advanced Trade Buy" => buy_records.push(record),
                "Coinbase Fee" => fee_records.push(record),
                _ => continue, // Skip other transaction types like Send, Sell, etc.
            }
        }

        // Process buy transactions
        for buy_record in buy_records {
            let amount_sats = btc_to_sats(&buy_record.quantity_transacted)?;
            let value_cents = usd_to_cents(&buy_record.total_inclusive)?;
            let timestamp = parse_coinbase_timestamp(&buy_record.timestamp)?;

            let request = CreateBitcoinTransactionRequest {
                r#type: TransactionType::Buy,
                amount_sats,
                fiat_amount_cents: Some(value_cents),
                fee_fiat_cents: Some(0),
                memo: Some(format!("Coinbase: {}", buy_record.notes)),
                timestamp,
            };

            let transaction = create_bitcoin_transaction(pool.clone(), request).await?;
            events.push(transaction);
        }

        // Process fee transactions
        for fee_record in fee_records {
            let fee_sats = btc_to_sats(&fee_record.quantity_transacted)?;
            let timestamp = parse_coinbase_timestamp(&fee_record.timestamp)?;

            let request = CreateBitcoinTransactionRequest {
                r#type: TransactionType::Fee,
                amount_sats: fee_sats,
                fiat_amount_cents: None,
                fee_fiat_cents: Some(0),
                memo: Some(format!("Coinbase Fee: {}", fee_record.notes)),
                timestamp,
            };

            let transaction = create_bitcoin_transaction(pool.clone(), request).await?;
            events.push(transaction);
        }
    }

    Ok(events)
}

async fn process_river_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<BitcoinTransaction>, String> {
    // Find the header line first (same logic as analyze_csv_file)
    let lines: Vec<&str> = content.lines().collect();
    let mut headers_line = 0;

    for (i, line) in lines.iter().enumerate() {
        if line.contains("Date") && line.contains("Type") && line.contains("Amount (BTC)") {
            headers_line = i;
            break;
        }
    }

    // Create CSV content starting from the header line
    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());
    let mut events = Vec::new();

    for result in reader.deserialize() {
        let record: RiverRecord =
            result.map_err(|e| format!("Failed to parse CSV record: {}", e))?;

        let timestamp = parse_river_timestamp(&record.date)?;

        match record.transaction_type.as_str() {
            "buy" => {
                let amount_sats = btc_to_sats(&record.amount_btc)?;
                let value_cents = usd_to_cents(&record.total_usd)?;

                let request = CreateBitcoinTransactionRequest {
                    r#type: TransactionType::Buy,
                    amount_sats,
                    fiat_amount_cents: Some(value_cents),
                    fee_fiat_cents: Some(0),
                    memo: Some(format!("River: {}", record.description)),
                    timestamp,
                };

                let transaction = create_bitcoin_transaction(pool.clone(), request).await?;
                events.push(transaction);

                // Handle fees if present
                if !record.fee_btc.is_empty() && record.fee_btc != "0" {
                    let fee_sats = btc_to_sats(&record.fee_btc)?;

                    let fee_request = CreateBitcoinTransactionRequest {
                        r#type: TransactionType::Fee,
                        amount_sats: fee_sats,
                        fiat_amount_cents: None,
                        fee_fiat_cents: Some(0),
                        memo: Some(format!("River Fee: {}", record.description)),
                        timestamp,
                    };

                    let fee_transaction =
                        create_bitcoin_transaction(pool.clone(), fee_request).await?;
                    events.push(fee_transaction);
                }
            }
            "sell" => {
                let amount_sats = btc_to_sats(&record.amount_btc)?;
                let value_cents = usd_to_cents(&record.total_usd)?;

                let request = CreateBitcoinTransactionRequest {
                    r#type: TransactionType::Sell,
                    amount_sats,
                    fiat_amount_cents: Some(value_cents),
                    fee_fiat_cents: Some(0),
                    memo: Some(format!("River: {}", record.description)),
                    timestamp,
                };

                let transaction = create_bitcoin_transaction(pool.clone(), request).await?;
                events.push(transaction);

                // Handle fees if present
                if !record.fee_btc.is_empty() && record.fee_btc != "0" {
                    let fee_sats = btc_to_sats(&record.fee_btc)?;

                    let fee_request = CreateBitcoinTransactionRequest {
                        r#type: TransactionType::Fee,
                        amount_sats: fee_sats,
                        fiat_amount_cents: None,
                        fee_fiat_cents: Some(0),
                        memo: Some(format!("River Fee: {}", record.description)),
                        timestamp,
                    };

                    let fee_transaction =
                        create_bitcoin_transaction(pool.clone(), fee_request).await?;
                    events.push(fee_transaction);
                }
            }
            _ => continue, // Skip other transaction types
        }
    }

    Ok(events)
}

#[tauri::command]
pub async fn analyze_csv_file(file_path: String) -> Result<CsvPreview, String> {
    let content =
        std::fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let lines: Vec<&str> = content.lines().collect();

    // Find the header line by looking for known patterns
    let mut headers_line = 0;
    let mut format = "Unknown".to_string();

    for (i, line) in lines.iter().enumerate() {
        if line.contains("Timestamp") && line.contains("Transaction Type") {
            headers_line = i;
            format = "Coinbase".to_string();
            break;
        } else if line.contains("Date") && line.contains("Type") && line.contains("Amount (BTC)") {
            headers_line = i;
            format = "River".to_string();
            break;
        }
    }

    if format == "Unknown" {
        return Err("Unrecognized CSV format".to_string());
    }

    // Parse from the header line onwards
    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());

    let mut sample_records = Vec::new();
    let mut total_records = 0;

    // Get headers first before iterating
    let headers = reader.headers().map(|h| h.clone()).ok();

    for (i, result) in reader.records().enumerate() {
        if let Ok(record) = result {
            total_records += 1;

            // Take first 3 records as samples
            if i < 3 {
                let mut record_map = serde_json::Map::new();
                if let Some(ref headers) = headers {
                    for (j, field) in record.iter().enumerate() {
                        if let Some(header) = headers.get(j) {
                            record_map.insert(
                                header.to_string(),
                                serde_json::Value::String(field.to_string()),
                            );
                        }
                    }
                }
                sample_records.push(serde_json::Value::Object(record_map));
            }
        }
    }

    Ok(CsvPreview {
        format,
        sample_records,
        total_records,
        headers_found_at_line: headers_line + 1, // 1-indexed for user display
    })
}

#[tauri::command]
pub async fn import_csv_data(
    pool: State<'_, SqlitePool>,
    file_path: String,
) -> Result<Vec<BitcoinTransaction>, String> {
    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file '{}': {}", file_path, e))?;

    let format = detect_csv_format(&content)?;

    let events = match format {
        CsvFormat::Coinbase => process_coinbase_csv(pool, &content).await?,
        CsvFormat::River => process_river_csv(pool, &content).await?,
    };

    println!(
        "Successfully imported {} events from {:?} CSV",
        events.len(),
        format
    );
    Ok(events)
}
