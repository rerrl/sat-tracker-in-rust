use crate::commands::bitcoin_transaction::create_bitcoin_transaction;
use crate::models::bitcoin_transaction::{CreateBitcoinTransactionRequest, TransactionType};
use chrono::{DateTime, Utc};
use sqlx::{Row, SqlitePool};
use tauri::State;

#[tauri::command]
pub async fn import_sat_tracker_v1_data(pool: State<'_, SqlitePool>) -> Result<String, String> {
    // Get the path to the v1 database
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let v1_db_path = home_dir.join(".sat-tracker").join("database.sqlite"); // real db

    println!("🔍 Looking for v1 database at: {}", v1_db_path.display());

    if !v1_db_path.exists() {
        let error_msg = format!("V1 database not found at: {}", v1_db_path.display());
        println!("❌ {}", error_msg);
        return Err(error_msg);
    }

    // Connect to the v1 database
    let v1_db_url = format!("sqlite:{}", v1_db_path.display());
    let v1_pool = SqlitePool::connect(&v1_db_url)
        .await
        .map_err(|e| format!("Failed to connect to v1 database: {}", e))?;

    let mut imported_count = 0;
    let mut errors = Vec::new();

    // Import BitcoinBuys as Buy events
    println!("📥 Importing BitcoinBuys...");
    let buys_query = "SELECT id, date, amountPaidUsd, amountReceivedSats, memo, createdAt FROM BitcoinBuys ORDER BY createdAt";

    match sqlx::query(buys_query).fetch_all(&v1_pool).await {
        Ok(buy_rows) => {
            println!("Found {} BitcoinBuy records", buy_rows.len());

            for row in buy_rows {
                let amount_sats: i64 = row.get("amountReceivedSats");
                let amount_paid_usd: f64 = row.get("amountPaidUsd");
                let value_cents = (amount_paid_usd * 100.0) as i64;
                let memo: Option<String> = row.get("memo");
                let date_str: String = row.get("date");

                // Parse the timestamp
                let timestamp = match DateTime::parse_from_rfc3339(&date_str) {
                    Ok(dt) => dt.with_timezone(&Utc),
                    Err(_) => {
                        // Try parsing as SQLite datetime format with milliseconds and timezone
                        match DateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S%.3f %z") {
                            Ok(dt) => dt.with_timezone(&Utc),
                            Err(_) => {
                                // Try parsing as SQLite datetime format without timezone
                                match chrono::NaiveDateTime::parse_from_str(
                                    &date_str,
                                    "%Y-%m-%d %H:%M:%S",
                                ) {
                                    Ok(naive_dt) => {
                                        DateTime::from_naive_utc_and_offset(naive_dt, Utc)
                                    }
                                    Err(e) => {
                                        errors.push(format!(
                                            "Failed to parse timestamp '{}': {}",
                                            date_str, e
                                        ));
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                };

                let request = CreateBitcoinTransactionRequest {
                    r#type: TransactionType::Buy,
                    amount_sats,
                    subtotal_cents: Some(value_cents),
                    fee_cents: Some(0),
                    memo,
                    timestamp,
                };

                match create_bitcoin_transaction(pool.clone(), request).await {
                    Ok(_) => imported_count += 1,
                    Err(e) => errors.push(format!("Failed to import buy record: {}", e)),
                }
            }
        }
        Err(e) => {
            println!("⚠️  No BitcoinBuys table found or error querying: {}", e);
        }
    }

    // Import DeductionEvents as Sell or Fee events
    println!("📥 Importing DeductionEvents...");
    let deductions_query =
        "SELECT id, date, amountSats, memo, createdAt FROM DeductionEvents ORDER BY createdAt";

        // TODO: fix this after new table schema

    // match sqlx::query(deductions_query).fetch_all(&v1_pool).await {
    //     Ok(deduction_rows) => {
    //         println!("Found {} DeductionEvent records", deduction_rows.len());

    //         for row in deduction_rows {
    //             let amount_sats: i64 = row.get::<i64, _>("amountSats"); // Make negative since it's a deduction
    //             let memo: Option<String> = row.get("memo");
    //             let date_str: String = row.get("date");

    //             // Determine event type based on memo content
    //             let transaction_type = if let Some(ref memo_text) = memo {
    //                 let memo_lower = memo_text.to_lowercase();
    //                 if memo_lower.contains("withdraw") || memo_lower.contains("fee") {
    //                     TransactionType::Fee
    //                 } else {
    //                     TransactionType::Sell
    //                 }
    //             } else {
    //                 TransactionType::Sell
    //             };

    //             // Parse the timestamp
    //             let timestamp = match DateTime::parse_from_rfc3339(&date_str) {
    //                 Ok(dt) => dt.with_timezone(&Utc),
    //                 Err(_) => {
    //                     // Try parsing as SQLite datetime format with milliseconds and timezone
    //                     match DateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S%.3f %z") {
    //                         Ok(dt) => dt.with_timezone(&Utc),
    //                         Err(_) => {
    //                             // Try parsing as SQLite datetime format without timezone
    //                             match chrono::NaiveDateTime::parse_from_str(
    //                                 &date_str,
    //                                 "%Y-%m-%d %H:%M:%S",
    //                             ) {
    //                                 Ok(naive_dt) => {
    //                                     DateTime::from_naive_utc_and_offset(naive_dt, Utc)
    //                                 }
    //                                 Err(e) => {
    //                                     errors.push(format!(
    //                                         "Failed to parse timestamp '{}': {}",
    //                                         date_str, e
    //                                     ));
    //                                     continue;
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //             };

    //             let request = CreateBitcoinTransactionRequest {
    //                 r#type: transaction_type,
    //                 amount_sats,
    //                 subtotal_cents: None, // DeductionEvents don't have USD value
    //                 fee_cents: Some(0),
    //                 memo,
    //                 timestamp,
    //             };

    //             match create_bitcoin_transaction(pool.clone(), request).await {
    //                 Ok(_) => imported_count += 1,
    //                 Err(e) => errors.push(format!("Failed to import deduction record: {}", e)),
    //             }
    //         }
    //     }
    //     Err(e) => {
    //         println!(
    //             "⚠️  No DeductionEvents table found or error querying: {}",
    //             e
    //         );
    //     }
    // }

    v1_pool.close().await;

    let mut summary = format!(
        "Import completed: {} records imported successfully",
        imported_count
    );

    if !errors.is_empty() {
        summary.push_str(&format!("\n{} errors occurred:", errors.len()));
        for (i, error) in errors.iter().enumerate() {
            if i < 5 {
                // Show first 5 errors
                summary.push_str(&format!("\n- {}", error));
            }
        }
        if errors.len() > 5 {
            summary.push_str(&format!("\n... and {} more errors", errors.len() - 5));
        }
    }

    println!("✅ {}", summary);
    Ok(summary)
}
