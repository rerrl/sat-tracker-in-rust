use crate::commands::bitcoin_transaction::create_bitcoin_transaction;
use crate::models::bitcoin_transaction::{
    CreateBitcoinTransactionRequest, ExchangeTransaction, TransactionType,
};
use chrono::{DateTime, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
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
    #[serde(rename = "ID")]
    id: String,
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
    #[serde(rename = "Sent Amount")]
    sent_amount: String,
    #[serde(rename = "Sent Currency")]
    sent_currency: String,
    #[serde(rename = "Received Amount")]
    received_amount: String,
    #[serde(rename = "Received Currency")]
    received_currency: String,
    #[serde(rename = "Fee Amount")]
    fee_amount: String,
    #[serde(rename = "Fee Currency")]
    fee_currency: String,
    #[serde(rename = "Tag")]
    tag: String,
}

#[derive(Debug)]
enum CsvFormat {
    Coinbase,
    River,
}

// Add this helper function to generate provider IDs
fn generate_coinbase_provider_id(records: &[CoinbaseRecord]) -> String {
    if records.len() == 1 {
        // For single records, use the actual Coinbase transaction ID
        let record = &records[0];
        format!("coinbase_{}", record.id)
    } else {
        // For grouped records, hash all individual transaction IDs
        let mut individual_ids: Vec<String> = records.iter().map(|r| r.id.clone()).collect();

        individual_ids.sort(); // Ensure consistent ordering
        let mut hasher = DefaultHasher::new();
        individual_ids.hash(&mut hasher);
        format!("coinbase_group_{:x}", hasher.finish())
    }
}

// Add this helper function to check for existing transactions
async fn transaction_exists_by_provider_id(
    pool: &SqlitePool,
    provider_id: &str,
) -> Result<bool, String> {
    let count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM exchange_transactions WHERE provider_id = ?")
            .bind(provider_id)
            .fetch_one(pool)
            .await
            .map_err(|e| format!("Database error checking for existing transaction: {}", e))?;

    Ok(count > 0)
}

fn detect_csv_format(content: &str) -> Result<CsvFormat, String> {
    let lines: Vec<&str> = content.lines().collect();
    if lines.is_empty() {
        return Err("Empty CSV file".to_string());
    }

    // Search through multiple lines to find the header (like analyze_csv_file does)
    for (i, line) in lines.iter().enumerate() {
        println!("Line {}: {}", i, line);

        if line.contains("ID") && line.contains("Timestamp") && line.contains("Transaction Type") {
            println!("Found Coinbase format at line {}", i);
            return Ok(CsvFormat::Coinbase);
        } else if line.contains("Date") && line.contains("Sent Amount") && line.contains("Received Amount") && line.contains("Tag") {
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
    Ok(((btc * 100_000_000.0).round() as i64).abs())
}

fn usd_to_cents(usd_str: &str) -> Result<i64, String> {
    let trimmed = usd_str.trim();
    
    // Handle empty or null values as zero
    if trimmed.is_empty() {
        return Ok(0);
    }
    
    let cleaned = trimmed.replace("$", "").replace(",", "");
    let usd: f64 = cleaned
        .parse()
        .map_err(|e| format!("Failed to parse USD amount '{}': {}", usd_str, e))?;
    Ok(((usd * 100.0).round() as i64).abs())
}

// Fee records not supported with Coinbase CSVs as this data is not available in the CSV
async fn process_coinbase_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<ExchangeTransaction>, String> {
    // Find the header line first (same logic as analyze_csv_file)
    let lines: Vec<&str> = content.lines().collect();
    let mut headers_line = 0;

    for (i, line) in lines.iter().enumerate() {
        if line.contains("ID") && line.contains("Timestamp") && line.contains("Transaction Type") {
            headers_line = i;
            break;
        }
    }

    // Create CSV content starting from the header line
    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());
    let mut events = Vec::new();

    // Get all BTC records first
    let mut btc_records = Vec::new();

    for result in reader.deserialize() {
        let record: CoinbaseRecord =
            result.map_err(|e| format!("Failed to parse CSV record: {}", e))?;

        // Filter only BTC transactions
        if record.asset == "BTC" {
            btc_records.push(record);
        }
    }

    // Group transactions by type
    let mut buy_records = Vec::new();
    let mut sell_records = Vec::new();

    for record in btc_records {
        match record.transaction_type.as_str() {
            "Buy" | "Advanced Trade Buy" => {
                buy_records.push(record);
            }
            "Sell" | "Advanced Trade Sell" => {
                sell_records.push(record);
            }
            _ => {
                // Skip other transaction types
                println!("Skipping transaction type: {}", record.transaction_type);
            }
        }
    }

    // Process buy and sell transactions using consolidated logic
    let transaction_groups = vec![
        (buy_records, TransactionType::Buy, "buy"),
        (sell_records, TransactionType::Sell, "sell"),
    ];

    for (mut records, tx_type, type_name) in transaction_groups {
        // Sort records by timestamp
        records.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

        let records_count = records.len();
        let mut grouped_records: Vec<Vec<CoinbaseRecord>> = Vec::new();
        let mut current_group: Vec<CoinbaseRecord> = Vec::new();

        // Group transactions by timestamp (within 5 seconds)
        for record in records {
            if current_group.is_empty() {
                current_group.push(record);
            } else {
                let current_timestamp = parse_coinbase_timestamp(&record.timestamp)?;
                let last_timestamp =
                    parse_coinbase_timestamp(&current_group.last().unwrap().timestamp)?;

                let time_diff = (current_timestamp - last_timestamp).num_seconds().abs();

                if time_diff <= 5 {
                    // Group with previous transaction (within 5 seconds)
                    current_group.push(record);
                } else {
                    // Start new group
                    grouped_records.push(current_group);
                    current_group = vec![record];
                }
            }
        }

        // Don't forget the last group
        if !current_group.is_empty() {
            grouped_records.push(current_group);
        }

        println!(
            "Grouped {} {} records into {} transactions",
            records_count,
            type_name,
            grouped_records.len()
        );

        // Process each group as a single transaction
        for group in grouped_records {
            let provider_id = generate_coinbase_provider_id(&group);

            // Check if this transaction already exists
            if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
                println!(
                    "Skipping duplicate {} transaction with provider_id: {}",
                    type_name, provider_id
                );
                continue;
            }

            let first_record = &group[0];
            let timestamp = parse_coinbase_timestamp(&first_record.timestamp)?;

            // Sum up all amounts and costs in the group
            let mut total_amount_sats = 0i64;
            let mut total_subtotal = 0i64;
            let mut total_inclusive = 0i64;
            let mut total_fees_and_spread = 0i64;
            let mut notes = Vec::new();

            for record in &group {
                total_amount_sats += btc_to_sats(&record.quantity_transacted)?;
                total_subtotal += usd_to_cents(&record.subtotal)?;
                total_inclusive += usd_to_cents(&record.total_inclusive)?;
                total_fees_and_spread += usd_to_cents(&record.fees_and_spread)?;
                if !record.notes.is_empty() {
                    notes.push(record.notes.clone());
                }
            }

            let memo = if group.len() > 1 {
                format!(
                    "Coinbase (grouped {} transactions): {}",
                    group.len(),
                    notes.join(", ")
                )
            } else {
                format!("Coinbase: {}", notes.join(", "))
            };

            let request = CreateBitcoinTransactionRequest {
                r#type: tx_type.clone(),
                amount_sats: total_amount_sats,
                subtotal_cents: Some(total_inclusive),
                fee_cents: Some(total_fees_and_spread),
                memo: Some(memo),
                timestamp,
                provider_id: Some(provider_id),
            };

            let transaction = create_bitcoin_transaction(pool.clone(), request).await?;
            events.push(transaction);
        }
    }

    println!("Successfully processed {} total transactions", events.len());
    Ok(events)
}

async fn process_river_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<ExchangeTransaction>, String> {
    // Find the header line first (same logic as analyze_csv_file)
    let lines: Vec<&str> = content.lines().collect();
    let mut headers_line = 0;

    for (i, line) in lines.iter().enumerate() {
        if line.contains("Date") && line.contains("Sent Amount") && line.contains("Received Amount") && line.contains("Tag") {
            headers_line = i;
            break;
        }
    }

    // Create CSV content starting from the header line
    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());
    let mut events = Vec::new();

    // Collect all records first so we can sort them
    let mut all_records = Vec::new();
    for result in reader.deserialize() {
        let record: RiverRecord =
            result.map_err(|e| format!("Failed to parse CSV record: {}", e))?;
        all_records.push(record);
    }

    // Sort records by date
    all_records.sort_by(|a, b| {
        let date_a = parse_river_timestamp(&a.date).unwrap_or_else(|_| Utc::now());
        let date_b = parse_river_timestamp(&b.date).unwrap_or_else(|_| Utc::now());
        date_a.cmp(&date_b)
    });

    // Process each record
    for record in all_records {
        // Destructure the record into variables
        let date = record.date;
        let sent_amount = record.sent_amount;
        let sent_currency = record.sent_currency;
        let received_amount = record.received_amount;
        let received_currency = record.received_currency;
        let fee_amount = record.fee_amount;
        let fee_currency = record.fee_currency;
        let tag = record.tag;

        // Parse timestamp
        let timestamp = parse_river_timestamp(&date)?;

        // Process Buy and Sell transactions
        match tag.as_str() {
            "Buy" => {
                if let Some(transaction) = process_river_buy_transaction(
                    pool.clone(),
                    &timestamp,
                    &sent_amount,
                    &sent_currency,
                    &received_amount,
                    &received_currency,
                    &fee_amount,
                ).await? {
                    events.push(transaction);
                }
            }
            "Sell" => {
                if let Some(transaction) = process_river_sell_transaction(
                    pool.clone(),
                    &timestamp,
                    &sent_amount,
                    &sent_currency,
                    &received_amount,
                    &received_currency,
                    &fee_amount,
                ).await? {
                    events.push(transaction);
                }
            }
            _ => {
                println!("Skipping transaction with unsupported tag: {}", tag);
            }
        }
    }

    Ok(events)
}

async fn process_river_buy_transaction(
    pool: State<'_, SqlitePool>,
    timestamp: &DateTime<Utc>,
    sent_amount: &str,
    sent_currency: &str,
    received_amount: &str,
    received_currency: &str,
    fee_amount: &str,
) -> Result<Option<ExchangeTransaction>, String> {
    // Validate currencies for buy: USD -> BTC
    if sent_currency != "USD" || received_currency != "BTC" {
        println!("Skipping buy transaction with unexpected currencies: {} -> {}", sent_currency, received_currency);
        return Ok(None);
    }

    // Parse amounts
    let amount_sats = btc_to_sats(received_amount)?;
    let subtotal_cents = usd_to_cents(sent_amount)?;
    let fee_cents = usd_to_cents(fee_amount)?;

    // Create provider ID for River
    let provider_id = format!("river_{}_{}", timestamp.timestamp(), amount_sats);

    // Check if this transaction already exists
    if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
        println!("Skipping duplicate River buy transaction with provider_id: {}", provider_id);
        return Ok(None);
    }

    let request = CreateBitcoinTransactionRequest {
        r#type: TransactionType::Buy,
        amount_sats,
        subtotal_cents: Some(subtotal_cents),
        fee_cents: Some(fee_cents),
        memo: Some("River".to_string()),
        timestamp: *timestamp,
        provider_id: Some(provider_id),
    };

    let transaction = create_bitcoin_transaction(pool, request).await?;
    println!("Created River buy transaction: {} sats for ${:.2}", amount_sats, subtotal_cents as f64 / 100.0);
    Ok(Some(transaction))
}

async fn process_river_sell_transaction(
    pool: State<'_, SqlitePool>,
    timestamp: &DateTime<Utc>,
    sent_amount: &str,
    sent_currency: &str,
    received_amount: &str,
    received_currency: &str,
    fee_amount: &str,
) -> Result<Option<ExchangeTransaction>, String> {
    // Validate currencies for sell: BTC -> USD
    if sent_currency != "BTC" || received_currency != "USD" {
        println!("Skipping sell transaction with unexpected currencies: {} -> {}", sent_currency, received_currency);
        return Ok(None);
    }

    // Parse amounts
    let amount_sats = btc_to_sats(sent_amount)?;
    let subtotal_cents = usd_to_cents(received_amount)?;
    let fee_cents = usd_to_cents(fee_amount)?;

    // Create provider ID for River
    let provider_id = format!("river_{}_{}", timestamp.timestamp(), amount_sats);

    // Check if this transaction already exists
    if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
        println!("Skipping duplicate River sell transaction with provider_id: {}", provider_id);
        return Ok(None);
    }

    let request = CreateBitcoinTransactionRequest {
        r#type: TransactionType::Sell,
        amount_sats,
        subtotal_cents: Some(subtotal_cents),
        fee_cents: Some(fee_cents),
        memo: Some("River".to_string()),
        timestamp: *timestamp,
        provider_id: Some(provider_id),
    };

    let transaction = create_bitcoin_transaction(pool, request).await?;
    println!("Created River sell transaction: {} sats for ${:.2}", amount_sats, subtotal_cents as f64 / 100.0);
    Ok(Some(transaction))
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
        if line.contains("ID") && line.contains("Timestamp") && line.contains("Transaction Type") {
            headers_line = i;
            format = "Coinbase".to_string();
            break;
        } else if line.contains("Date") && line.contains("Sent Amount") && line.contains("Received Amount") && line.contains("Tag") {
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
) -> Result<Vec<ExchangeTransaction>, String> {
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
