use crate::models::balance_change_event::{BalanceChangeEvent, CreateBalanceChangeEventRequest, BalanceChangeType};
use crate::commands::balance_change_event::create_balance_change_event;
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDateTime};
use sqlx::SqlitePool;
use tauri::State;
use std::collections::HashMap;
use serde::Deserialize;

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
    #[serde(rename = "USD Spot Price at Transaction")]
    usd_spot_price: String,
    #[serde(rename = "USD Subtotal")]
    usd_subtotal: String,
    #[serde(rename = "USD Total (inclusive of fees)")]
    usd_total: String,
    #[serde(rename = "USD Fees")]
    usd_fees: String,
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
    
    let header = lines[0];
    
    if header.contains("Timestamp") && header.contains("Transaction Type") && header.contains("USD Spot Price at Transaction") {
        Ok(CsvFormat::Coinbase)
    } else if header.contains("Date") && header.contains("Type") && header.contains("Amount (BTC)") {
        Ok(CsvFormat::River)
    } else {
        Err("Unrecognized CSV format. Expected Coinbase or River format.".to_string())
    }
}

fn parse_coinbase_timestamp(timestamp_str: &str) -> Result<DateTime<Utc>, String> {
    // Coinbase format: "2024-01-15T10:30:45Z"
    DateTime::parse_from_rfc3339(timestamp_str)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| format!("Failed to parse Coinbase timestamp '{}': {}", timestamp_str, e))
}

fn parse_river_timestamp(date_str: &str) -> Result<DateTime<Utc>, String> {
    // River format: "2024-01-15 10:30:45"
    NaiveDateTime::parse_from_str(date_str, "%Y-%m-%d %H:%M:%S")
        .map(|dt| dt.and_utc())
        .map_err(|e| format!("Failed to parse River timestamp '{}': {}", date_str, e))
}

fn btc_to_sats(btc_str: &str) -> Result<i64, String> {
    let btc: f64 = btc_str.parse()
        .map_err(|e| format!("Failed to parse BTC amount '{}': {}", btc_str, e))?;
    Ok((btc * 100_000_000.0).round() as i64)
}

fn usd_to_cents(usd_str: &str) -> Result<i64, String> {
    let cleaned = usd_str.replace("$", "").replace(",", "");
    let usd: f64 = cleaned.parse()
        .map_err(|e| format!("Failed to parse USD amount '{}': {}", usd_str, e))?;
    Ok((usd * 100.0).round() as i64)
}

async fn process_coinbase_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<BalanceChangeEvent>, String> {
    let mut reader = csv::Reader::from_reader(content.as_bytes());
    let mut events = Vec::new();
    let mut grouped_transactions: HashMap<String, Vec<CoinbaseRecord>> = HashMap::new();
    
    // First pass: group transactions by timestamp (within 60 seconds)
    for result in reader.deserialize() {
        let record: CoinbaseRecord = result
            .map_err(|e| format!("Failed to parse CSV record: {}", e))?;
        
        if record.asset != "BTC" {
            continue; // Skip non-Bitcoin transactions
        }
        
        let timestamp = parse_coinbase_timestamp(&record.timestamp)?;
        let timestamp_key = timestamp.timestamp().to_string();
        
        grouped_transactions.entry(timestamp_key).or_insert_with(Vec::new).push(record);
    }
    
    // Second pass: process grouped transactions
    for (_, group) in grouped_transactions {
        let mut buy_records = Vec::new();
        let mut fee_records = Vec::new();
        
        for record in group {
            match record.transaction_type.as_str() {
                "Buy" => buy_records.push(record),
                "Coinbase Fee" => fee_records.push(record),
                _ => continue, // Skip other transaction types
            }
        }
        
        // Process buy transactions
        for buy_record in buy_records {
            let amount_sats = btc_to_sats(&buy_record.quantity_transacted)?;
            let value_cents = usd_to_cents(&buy_record.usd_total)?;
            let timestamp = parse_coinbase_timestamp(&buy_record.timestamp)?;
            
            let request = CreateBalanceChangeEventRequest {
                amount_sats,
                value_cents: Some(value_cents),
                event_type: BalanceChangeType::Buy,
                memo: Some(format!("Coinbase: {}", buy_record.notes)),
                timestamp,
            };
            
            let event = create_balance_change_event(pool.clone(), request).await?;
            events.push(event);
        }
        
        // Process fee transactions
        for fee_record in fee_records {
            let fee_sats = btc_to_sats(&fee_record.quantity_transacted)?;
            let timestamp = parse_coinbase_timestamp(&fee_record.timestamp)?;
            
            let request = CreateBalanceChangeEventRequest {
                amount_sats: fee_sats,
                value_cents: None,
                event_type: BalanceChangeType::Fee,
                memo: Some(format!("Coinbase Fee: {}", fee_record.notes)),
                timestamp,
            };
            
            let event = create_balance_change_event(pool.clone(), request).await?;
            events.push(event);
        }
    }
    
    Ok(events)
}

async fn process_river_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<BalanceChangeEvent>, String> {
    let mut reader = csv::Reader::from_reader(content.as_bytes());
    let mut events = Vec::new();
    
    for result in reader.deserialize() {
        let record: RiverRecord = result
            .map_err(|e| format!("Failed to parse CSV record: {}", e))?;
        
        let timestamp = parse_river_timestamp(&record.date)?;
        
        match record.transaction_type.as_str() {
            "buy" => {
                let amount_sats = btc_to_sats(&record.amount_btc)?;
                let value_cents = usd_to_cents(&record.total_usd)?;
                
                let request = CreateBalanceChangeEventRequest {
                    amount_sats,
                    value_cents: Some(value_cents),
                    event_type: BalanceChangeType::Buy,
                    memo: Some(format!("River: {}", record.description)),
                    timestamp,
                };
                
                let event = create_balance_change_event(pool.clone(), request).await?;
                events.push(event);
                
                // Handle fees if present
                if !record.fee_btc.is_empty() && record.fee_btc != "0" {
                    let fee_sats = btc_to_sats(&record.fee_btc)?;
                    
                    let fee_request = CreateBalanceChangeEventRequest {
                        amount_sats: fee_sats,
                        value_cents: None,
                        event_type: BalanceChangeType::Fee,
                        memo: Some(format!("River Fee: {}", record.description)),
                        timestamp,
                    };
                    
                    let fee_event = create_balance_change_event(pool.clone(), fee_request).await?;
                    events.push(fee_event);
                }
            }
            "sell" => {
                let amount_sats = btc_to_sats(&record.amount_btc)?;
                let value_cents = usd_to_cents(&record.total_usd)?;
                
                let request = CreateBalanceChangeEventRequest {
                    amount_sats,
                    value_cents: Some(value_cents),
                    event_type: BalanceChangeType::Sell,
                    memo: Some(format!("River: {}", record.description)),
                    timestamp,
                };
                
                let event = create_balance_change_event(pool.clone(), request).await?;
                events.push(event);
                
                // Handle fees if present
                if !record.fee_btc.is_empty() && record.fee_btc != "0" {
                    let fee_sats = btc_to_sats(&record.fee_btc)?;
                    
                    let fee_request = CreateBalanceChangeEventRequest {
                        amount_sats: fee_sats,
                        value_cents: None,
                        event_type: BalanceChangeType::Fee,
                        memo: Some(format!("River Fee: {}", record.description)),
                        timestamp,
                    };
                    
                    let fee_event = create_balance_change_event(pool.clone(), fee_request).await?;
                    events.push(fee_event);
                }
            }
            _ => continue, // Skip other transaction types
        }
    }
    
    Ok(events)
}

#[tauri::command]
pub async fn import_csv_data(
    pool: State<'_, SqlitePool>,
    file_path: String,
) -> Result<Vec<BalanceChangeEvent>, String> {
    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file '{}': {}", file_path, e))?;
    
    let format = detect_csv_format(&content)?;
    
    let events = match format {
        CsvFormat::Coinbase => process_coinbase_csv(pool, &content).await?,
        CsvFormat::River => process_river_csv(pool, &content).await?,
    };
    
    println!("Successfully imported {} events from {:?} CSV", events.len(), format);
    Ok(events)
}
