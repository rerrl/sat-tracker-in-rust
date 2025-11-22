use crate::commands::exchange_transaction::create_exchange_transaction;
use crate::models::exchange_transaction::{
    CreateExchangeTransactionRequest, ExchangeTransaction, TransactionType,
};
use chrono::{DateTime, NaiveDateTime, Utc};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::PathBuf;
use tauri::{command, AppHandle, Manager, State};

// ============================================================================
// ENCRYPTION FUNCTIONALITY
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStatus {
    pub is_encrypted: bool,
    pub needs_password: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordValidationResult {
    pub is_valid: bool,
    pub error_message: Option<String>,
}

fn get_database_path() -> PathBuf {
    #[cfg(debug_assertions)]
    {
        let mut path = std::env::current_dir().unwrap();
        path.push("db");
        std::fs::create_dir_all(&path).ok();
        path.push("sat_tracker.db");
        path
    }

    #[cfg(not(debug_assertions))]
    {
        let mut path = dirs::home_dir().unwrap_or_else(|| std::env::current_dir().unwrap());
        path.push(".sat-tracker-in-rust");
        std::fs::create_dir_all(&path).ok();
        path.push("sat_tracker.db");
        path
    }
}

#[command]
pub async fn check_database_status() -> Result<DatabaseStatus, String> {
    let db_path = get_database_path();

    if !db_path.exists() {
        return Ok(DatabaseStatus {
            is_encrypted: false,
            needs_password: false,
        });
    }

    println!("🗄️  Database path: {}", db_path.display());

    match Connection::open(&db_path) {
        Ok(conn) => {
            match conn
                .prepare("SELECT COUNT(*) FROM sqlite_master")
                .and_then(|mut stmt| stmt.query_row([], |_| Ok(())))
            {
                Ok(_) => Ok(DatabaseStatus {
                    is_encrypted: false,
                    needs_password: false,
                }),
                Err(e) => {
                    let error_msg = e.to_string().to_lowercase();
                    println!("🔐 Database query failed: {}", e);
                    if error_msg.contains("file is not a database")
                        || error_msg.contains("file is encrypted")
                        || error_msg.contains("cipher")
                    {
                        Ok(DatabaseStatus {
                            is_encrypted: true,
                            needs_password: true,
                        })
                    } else {
                        println!("⚠️ Database query failed but doesn't seem encrypted: {}", e);
                        Ok(DatabaseStatus {
                            is_encrypted: false,
                            needs_password: false,
                        })
                    }
                }
            }
        }
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("encrypted") || error_msg.contains("cipher") {
                Ok(DatabaseStatus {
                    is_encrypted: true,
                    needs_password: true,
                })
            } else {
                Err(format!("Failed to check database: {}", e))
            }
        }
    }
}

#[command]
pub async fn validate_database_password(
    password: String,
) -> Result<PasswordValidationResult, String> {
    let db_path = get_database_path();

    println!("🔐 Validating password for database: {}", db_path.display());
    println!("🔑 Password length: {}", password.len());

    if !db_path.exists() {
        println!("❌ Database file does not exist");
        return Ok(PasswordValidationResult {
            is_valid: false,
            error_message: Some("Database does not exist".to_string()),
        });
    }

    match Connection::open(&db_path) {
        Ok(conn) => {
            println!("✅ Successfully opened database connection");

            println!("🔑 Setting encryption key...");
            if let Err(e) = conn.pragma_update(None, "key", &password) {
                println!("❌ Failed to set encryption key: {}", e);
                return Ok(PasswordValidationResult {
                    is_valid: false,
                    error_message: Some(format!("Failed to set key: {}", e)),
                });
            }
            println!("✅ Encryption key set successfully");

            println!("🔍 Testing database access with query...");
            match conn
                .prepare("SELECT name FROM sqlite_master LIMIT 1")
                .and_then(|mut stmt| stmt.query_row([], |_| Ok(())))
            {
                Ok(_) => {
                    println!("✅ Password validation successful - database accessible");
                    Ok(PasswordValidationResult {
                        is_valid: true,
                        error_message: None,
                    })
                }
                Err(e) => {
                    println!("❌ Password validation failed - query error: {}", e);
                    let error_msg = e.to_string().to_lowercase();
                    let user_friendly_error = if error_msg.contains("file is not a database")
                        || error_msg.contains("file is encrypted")
                        || error_msg.contains("cipher")
                    {
                        "Incorrect password. Please try again.".to_string()
                    } else {
                        format!("Database error: {}", e)
                    };

                    Ok(PasswordValidationResult {
                        is_valid: false,
                        error_message: Some(user_friendly_error),
                    })
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to open database connection: {}", e);
            Err(format!("Failed to open database: {}", e))
        }
    }
}

#[command]
pub async fn encrypt_database(password: String) -> Result<String, String> {
    let db_path = get_database_path();

    if !db_path.exists() {
        return Err("Database does not exist".to_string());
    }

    let status = check_database_status().await?;
    if status.is_encrypted {
        return Err("Database is already encrypted".to_string());
    }

    let backup_path = db_path.with_extension("db.backup");

    if let Err(e) = std::fs::copy(&db_path, &backup_path) {
        return Err(format!("Failed to create backup: {}", e));
    }

    let source_conn =
        Connection::open(&db_path).map_err(|e| format!("Failed to open source database: {}", e))?;

    let encrypted_path = db_path.with_extension("db.encrypted");

    let encrypted_conn = Connection::open(&encrypted_path)
        .map_err(|e| format!("Failed to create encrypted database: {}", e))?;

    encrypted_conn
        .pragma_update(None, "key", &password)
        .map_err(|e| format!("Failed to set encryption key: {}", e))?;

    drop(source_conn);
    drop(encrypted_conn);

    std::fs::rename(&encrypted_path, &db_path)
        .map_err(|e| format!("Failed to replace database: {}", e))?;

    let _pool = crate::database::init_database_with_password(Some(password.clone()))
        .await
        .map_err(|e| format!("Failed to initialize encrypted database: {}", e))?;

    println!("📋 Starting data copy from backup to encrypted database...");

    let backup_conn = Connection::open(&backup_path)
        .map_err(|e| format!("Failed to open backup database: {}", e))?;

    let encrypted_conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open encrypted database: {}", e))?;

    encrypted_conn
        .pragma_update(None, "key", &password)
        .map_err(|e| format!("Failed to set encryption key: {}", e))?;

    let mut stmt = backup_conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_sqlx_%'")
        .map_err(|e| format!("Failed to prepare table query: {}", e))?;

    let table_names: Result<Vec<String>, _> = stmt
        .query_map([], |row| Ok(row.get::<_, String>(0)?))
        .map_err(|e| format!("Failed to query table names: {}", e))?
        .collect();

    let table_names = table_names.map_err(|e| format!("Failed to get table names: {}", e))?;

    println!(
        "📊 Found {} tables to copy: {:?}",
        table_names.len(),
        table_names
    );

    for table_name in table_names {
        println!("🔄 Copying data for table: {}", table_name);

        let mut column_stmt = backup_conn
            .prepare(&format!("PRAGMA table_info({})", table_name))
            .map_err(|e| format!("Failed to get column info for {}: {}", table_name, e))?;

        let column_info: Result<Vec<(String, String, bool)>, _> = column_stmt
            .query_map([], |row| {
                let name: String = row.get(1)?;
                let type_name: String = row.get(2)?;
                let not_null: bool = row.get(3)?;
                Ok((name, type_name, not_null))
            })
            .map_err(|e| format!("Failed to query column info for {}: {}", table_name, e))?
            .collect();

        let column_info = column_info.map_err(|e| format!("Failed to get column info: {}", e))?;
        let column_names: Vec<String> = column_info
            .iter()
            .map(|(name, _, _)| name.clone())
            .collect();

        println!("📋 Table {} has columns: {:?}", table_name, column_names);

        let mut count_stmt = backup_conn
            .prepare(&format!("SELECT COUNT(*) FROM {}", table_name))
            .map_err(|e| format!("Failed to prepare count query for {}: {}", table_name, e))?;

        let row_count: i64 = count_stmt
            .query_row([], |row| row.get(0))
            .map_err(|e| format!("Failed to count rows in {}: {}", table_name, e))?;

        println!("📊 Table {} has {} rows to copy", table_name, row_count);

        if row_count > 0 {
            let mut data_stmt = backup_conn
                .prepare(&format!("SELECT * FROM {}", table_name))
                .map_err(|e| format!("Failed to prepare data query for {}: {}", table_name, e))?;

            let column_count = data_stmt.column_count();
            let placeholders = (0..column_count)
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(", ");
            let insert_query = format!("INSERT INTO {} VALUES ({})", table_name, placeholders);

            println!("🔍 Insert query: {}", insert_query);

            let data_rows = data_stmt
                .query_map([], |row| {
                    let mut row_data = Vec::new();
                    for i in 0..column_count {
                        let value: rusqlite::types::Value = row.get(i)?;
                        row_data.push(value);
                    }
                    Ok(row_data)
                })
                .map_err(|e| format!("Failed to query data for {}: {}", table_name, e))?;

            let mut copied_rows = 0;
            for row_result in data_rows {
                let row_data = row_result.map_err(|e| format!("Failed to get row data: {}", e))?;

                println!("🔍 Row data for {}: {:?}", table_name, row_data);

                let params: Vec<&dyn rusqlite::ToSql> =
                    row_data.iter().map(|v| v as &dyn rusqlite::ToSql).collect();

                encrypted_conn
                    .execute(&insert_query, params.as_slice())
                    .map_err(|e| {
                        format!(
                            "Failed to insert data into {} (row data: {:?}): {}",
                            table_name, row_data, e
                        )
                    })?;

                copied_rows += 1;
            }

            println!(
                "✅ Successfully copied {} rows to table {}",
                copied_rows, table_name
            );
        } else {
            println!("⏭️ Skipping empty table: {}", table_name);
        }
    }

    println!("✅ Data copy completed successfully");

    std::fs::remove_file(&backup_path).ok();

    Ok("Database encrypted successfully".to_string())
}

#[command]
pub async fn change_database_password(
    old_password: String,
    new_password: String,
) -> Result<String, String> {
    let db_path = get_database_path();

    if !db_path.exists() {
        return Err("Database does not exist".to_string());
    }

    let validation = validate_database_password(old_password.clone()).await?;
    if !validation.is_valid {
        return Err("Invalid current password".to_string());
    }

    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))?;

    conn.pragma_update(None, "key", &old_password)
        .map_err(|e| format!("Failed to set old key: {}", e))?;

    conn.pragma_update(None, "rekey", &new_password)
        .map_err(|e| format!("Failed to change password: {}", e))?;

    Ok("Password changed successfully".to_string())
}

#[command]
pub async fn initialize_database_with_password(
    app_handle: AppHandle,
    password: Option<String>,
) -> Result<String, String> {
    use crate::database;

    let pool = database::init_database_with_password(password)
        .await
        .map_err(|e| format!("Failed to initialize database: {}", e))?;

    app_handle.manage(pool);

    Ok("Database initialized successfully".to_string())
}

// ============================================================================
// SAT TRACKER V1 IMPORT FUNCTIONALITY
// ============================================================================

#[tauri::command]
pub async fn import_sat_tracker_v1_data(pool: State<'_, SqlitePool>) -> Result<String, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let v1_db_path = home_dir.join(".sat-tracker").join("database.sqlite");

    println!("🔍 Looking for v1 database at: {}", v1_db_path.display());

    if !v1_db_path.exists() {
        let error_msg = format!("V1 database not found at: {}", v1_db_path.display());
        println!("❌ {}", error_msg);
        return Err(error_msg);
    }

    let v1_db_url = format!("sqlite:{}", v1_db_path.display());
    let v1_pool = SqlitePool::connect(&v1_db_url)
        .await
        .map_err(|e| format!("Failed to connect to v1 database: {}", e))?;

    let mut imported_count = 0;
    let mut errors = Vec::new();

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

                let timestamp = match DateTime::parse_from_rfc3339(&date_str) {
                    Ok(dt) => dt.with_timezone(&Utc),
                    Err(_) => {
                        match DateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S%.3f %z") {
                            Ok(dt) => dt.with_timezone(&Utc),
                            Err(_) => {
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

                let provider_id = format!("stv1-import-{}_{}", timestamp.timestamp(), amount_sats);

                if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
                    println!(
                        "Skipping duplicate transaction with provider_id: {}",
                        provider_id
                    );
                    continue;
                }

                let request = CreateExchangeTransactionRequest {
                    r#type: TransactionType::Buy,
                    amount_sats,
                    subtotal_cents: Some(value_cents),
                    fee_cents: Some(0),
                    memo,
                    timestamp,
                    provider_id: Some(provider_id),
                };

                match create_exchange_transaction(pool.clone(), request).await {
                    Ok(_) => imported_count += 1,
                    Err(e) => errors.push(format!("Failed to import buy record: {}", e)),
                }
            }
        }
        Err(e) => {
            println!("⚠️  No BitcoinBuys table found or error querying: {}", e);
        }
    }

    println!("📥 Importing DeductionEvents as sell transactions...");
    let deductions_query = "SELECT id, date, amountSats, memo, createdAt FROM DeductionEvents ORDER BY createdAt";

    match sqlx::query(deductions_query).fetch_all(&v1_pool).await {
        Ok(deduction_rows) => {
            println!("Found {} DeductionEvent records", deduction_rows.len());

            for row in deduction_rows {
                let amount_sats: i64 = row.get("amountSats");
                let memo: Option<String> = row.get("memo");
                let date_str: String = row.get("date");

                let timestamp = match DateTime::parse_from_rfc3339(&date_str) {
                    Ok(dt) => dt.with_timezone(&Utc),
                    Err(_) => {
                        match DateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S%.3f %z") {
                            Ok(dt) => dt.with_timezone(&Utc),
                            Err(_) => {
                                match chrono::NaiveDateTime::parse_from_str(
                                    &date_str,
                                    "%Y-%m-%d %H:%M:%S",
                                ) {
                                    Ok(naive_dt) => {
                                        DateTime::from_naive_utc_and_offset(naive_dt, Utc)
                                    }
                                    Err(e) => {
                                        errors.push(format!(
                                            "Failed to parse deduction timestamp '{}': {}",
                                            date_str, e
                                        ));
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                };

                let provider_id = format!("stv1-deduction-{}_{}", timestamp.timestamp(), amount_sats);

                if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
                    println!(
                        "Skipping duplicate deduction transaction with provider_id: {}",
                        provider_id
                    );
                    continue;
                }

                let request = CreateExchangeTransactionRequest {
                    r#type: TransactionType::Sell,
                    amount_sats,
                    subtotal_cents: Some(0),
                    fee_cents: Some(0),
                    memo,
                    timestamp,
                    provider_id: Some(provider_id),
                };

                match create_exchange_transaction(pool.clone(), request).await {
                    Ok(_) => imported_count += 1,
                    Err(e) => errors.push(format!("Failed to import deduction record: {}", e)),
                }
            }
        }
        Err(e) => {
            println!("⚠️  No DeductionEvents table found or error querying: {}", e);
        }
    }

    v1_pool.close().await;

    let mut summary = format!(
        "Import completed: {} records imported successfully",
        imported_count
    );

    if !errors.is_empty() {
        summary.push_str(&format!("\n{} errors occurred:", errors.len()));
        for (i, error) in errors.iter().enumerate() {
            if i < 5 {
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

// ============================================================================
// CSV IMPORT FUNCTIONALITY
// ============================================================================

#[derive(Debug, Serialize)]
pub struct CsvPreview {
    format: String,
    bitcoin_transactions_found: usize,
    headers_found_at_line: usize,
    total_rows_in_file: usize,
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

fn generate_coinbase_provider_id(records: &[CoinbaseRecord]) -> String {
    if records.len() == 1 {
        let record = &records[0];
        format!("coinbase_{}", record.id)
    } else {
        let mut individual_ids: Vec<String> = records.iter().map(|r| r.id.clone()).collect();
        individual_ids.sort();
        let mut hasher = DefaultHasher::new();
        individual_ids.hash(&mut hasher);
        format!("coinbase_group_{:x}", hasher.finish())
    }
}

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

    for (i, line) in lines.iter().enumerate() {
        println!("Line {}: {}", i, line);

        if line.contains("ID") && line.contains("Timestamp") && line.contains("Transaction Type") {
            println!("Found Coinbase format at line {}", i);
            return Ok(CsvFormat::Coinbase);
        } else if line.contains("Date")
            && line.contains("Sent Amount")
            && line.contains("Received Amount")
            && line.contains("Tag")
        {
            println!("Found River format at line {}", i);
            return Ok(CsvFormat::River);
        }
    }

    Err("Unrecognized CSV format. Expected Coinbase or River format.".to_string())
}

fn parse_coinbase_timestamp(timestamp_str: &str) -> Result<DateTime<Utc>, String> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(timestamp_str) {
        return Ok(dt.with_timezone(&Utc));
    }

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

    if trimmed.is_empty() {
        return Ok(0);
    }

    let cleaned = trimmed.replace("$", "").replace(",", "");
    let usd: f64 = cleaned
        .parse()
        .map_err(|e| format!("Failed to parse USD amount '{}': {}", usd_str, e))?;
    Ok(((usd * 100.0).round() as i64).abs())
}

async fn process_coinbase_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<ExchangeTransaction>, String> {
    let lines: Vec<&str> = content.lines().collect();
    let mut headers_line = 0;

    for (i, line) in lines.iter().enumerate() {
        if line.contains("ID") && line.contains("Timestamp") && line.contains("Transaction Type") {
            headers_line = i;
            break;
        }
    }

    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());
    let mut events = Vec::new();

    let mut btc_records = Vec::new();

    for result in reader.deserialize() {
        let record: CoinbaseRecord =
            result.map_err(|e| format!("Failed to parse CSV record: {}", e))?;

        if record.asset == "BTC" {
            btc_records.push(record);
        }
    }

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
                println!("Skipping transaction type: {}", record.transaction_type);
            }
        }
    }

    let transaction_groups = vec![
        (buy_records, TransactionType::Buy, "buy"),
        (sell_records, TransactionType::Sell, "sell"),
    ];

    for (mut records, tx_type, type_name) in transaction_groups {
        records.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

        let records_count = records.len();
        let mut grouped_records: Vec<Vec<CoinbaseRecord>> = Vec::new();
        let mut current_group: Vec<CoinbaseRecord> = Vec::new();

        for record in records {
            if current_group.is_empty() {
                current_group.push(record);
            } else {
                let current_timestamp = parse_coinbase_timestamp(&record.timestamp)?;
                let last_timestamp =
                    parse_coinbase_timestamp(&current_group.last().unwrap().timestamp)?;

                let time_diff = (current_timestamp - last_timestamp).num_seconds().abs();

                if time_diff <= 5 {
                    current_group.push(record);
                } else {
                    grouped_records.push(current_group);
                    current_group = vec![record];
                }
            }
        }

        if !current_group.is_empty() {
            grouped_records.push(current_group);
        }

        println!(
            "Grouped {} {} records into {} transactions",
            records_count,
            type_name,
            grouped_records.len()
        );

        for group in grouped_records {
            let provider_id = generate_coinbase_provider_id(&group);

            if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
                println!(
                    "Skipping duplicate {} transaction with provider_id: {}",
                    type_name, provider_id
                );
                continue;
            }

            let first_record = &group[0];
            let timestamp = parse_coinbase_timestamp(&first_record.timestamp)?;

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

            let request = CreateExchangeTransactionRequest {
                r#type: tx_type.clone(),
                amount_sats: total_amount_sats,
                subtotal_cents: Some(total_subtotal),
                fee_cents: Some(total_fees_and_spread),
                memo: Some(memo),
                timestamp,
                provider_id: Some(provider_id),
            };

            let transaction = create_exchange_transaction(pool.clone(), request).await?;
            events.push(transaction);
        }
    }

    println!("Successfully processed {} total transactions", events.len());
    Ok(events)
}

#[tauri::command]
pub async fn create_undocumented_lumpsum_transactions(
    pool: State<'_, SqlitePool>,
    start_date: String,
    end_date: String,
    total_sats: i64,
    total_usd_cents: i64,
    frequency: String,
    memo: Option<String>,
) -> Result<Vec<ExchangeTransaction>, String> {
    use chrono::Duration;
    use rand::Rng;

    let start = DateTime::parse_from_rfc3339(&start_date)
        .map_err(|e| format!("Invalid start date: {}", e))?
        .with_timezone(&Utc);

    let end = DateTime::parse_from_rfc3339(&end_date)
        .map_err(|e| format!("Invalid end date: {}", e))?
        .with_timezone(&Utc);

    if start >= end {
        return Err("Start date must be before end date".to_string());
    }

    let final_memo = memo.unwrap_or_else(|| {
        let mut rng = rand::thread_rng();
        let id: u16 = rng.gen_range(1000..=9999);
        format!("DCA {}", id)
    });

    let interval_days = match frequency.as_str() {
        "daily" => 1,
        "weekly" => 7,
        "monthly" => 30,
        _ => return Err("Invalid frequency. Use 'daily', 'weekly', or 'monthly'".to_string()),
    };

    let total_days = (end - start).num_days();
    let num_intervals = (total_days / interval_days).max(1);

    let sats_per_interval = total_sats / num_intervals;
    let cents_per_interval = total_usd_cents / num_intervals;

    let remaining_sats = total_sats % num_intervals;
    let remaining_cents = total_usd_cents % num_intervals;

    let mut created_transactions = Vec::new();
    let mut current_date = start;

    for i in 0..num_intervals {
        let is_last = i == num_intervals - 1;

        let amount_sats = if is_last {
            sats_per_interval + remaining_sats
        } else {
            sats_per_interval
        };

        let subtotal_cents = if is_last {
            cents_per_interval + remaining_cents
        } else {
            cents_per_interval
        };

        let request = CreateExchangeTransactionRequest {
            r#type: TransactionType::Buy,
            amount_sats,
            subtotal_cents: Some(subtotal_cents),
            fee_cents: Some(0),
            memo: Some(final_memo.clone()),
            timestamp: current_date,
            provider_id: None,
        };

        match create_exchange_transaction(pool.clone(), request).await {
            Ok(transaction) => created_transactions.push(transaction),
            Err(e) => return Err(format!("Failed to create transaction {}: {}", i + 1, e)),
        }

        current_date = current_date + Duration::days(interval_days);
    }

    Ok(created_transactions)
}

async fn process_river_csv(
    pool: State<'_, SqlitePool>,
    content: &str,
) -> Result<Vec<ExchangeTransaction>, String> {
    let lines: Vec<&str> = content.lines().collect();
    let mut headers_line = 0;

    for (i, line) in lines.iter().enumerate() {
        if line.contains("Date")
            && line.contains("Sent Amount")
            && line.contains("Received Amount")
            && line.contains("Tag")
        {
            headers_line = i;
            break;
        }
    }

    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());
    let mut events = Vec::new();

    let mut all_records = Vec::new();
    for result in reader.deserialize() {
        let record: RiverRecord =
            result.map_err(|e| format!("Failed to parse CSV record: {}", e))?;
        all_records.push(record);
    }

    all_records.sort_by(|a, b| {
        let date_a = parse_river_timestamp(&a.date).unwrap_or_else(|_| Utc::now());
        let date_b = parse_river_timestamp(&b.date).unwrap_or_else(|_| Utc::now());
        date_a.cmp(&date_b)
    });

    for record in all_records {
        let date = record.date;
        let sent_amount = record.sent_amount;
        let sent_currency = record.sent_currency;
        let received_amount = record.received_amount;
        let received_currency = record.received_currency;
        let fee_amount = record.fee_amount;
        let tag = record.tag;

        let timestamp = parse_river_timestamp(&date)?;

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
                )
                .await?
                {
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
                )
                .await?
                {
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
    if sent_currency != "USD" || received_currency != "BTC" {
        println!(
            "Skipping buy transaction with unexpected currencies: {} -> {}",
            sent_currency, received_currency
        );
        return Ok(None);
    }

    let amount_sats = btc_to_sats(received_amount)?;
    let subtotal_cents = usd_to_cents(sent_amount)?;
    let fee_cents = usd_to_cents(fee_amount)?;

    let provider_id = format!("river_{}_{}", timestamp.timestamp(), amount_sats);

    if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
        println!(
            "Skipping duplicate River buy transaction with provider_id: {}",
            provider_id
        );
        return Ok(None);
    }

    let request = CreateExchangeTransactionRequest {
        r#type: TransactionType::Buy,
        amount_sats,
        subtotal_cents: Some(subtotal_cents),
        fee_cents: Some(fee_cents),
        memo: Some("River".to_string()),
        timestamp: *timestamp,
        provider_id: Some(provider_id),
    };

    let transaction = create_exchange_transaction(pool, request).await?;
    println!(
        "Created River buy transaction: {} sats for ${:.2}",
        amount_sats,
        subtotal_cents as f64 / 100.0
    );
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
    if sent_currency != "BTC" || received_currency != "USD" {
        println!(
            "Skipping sell transaction with unexpected currencies: {} -> {}",
            sent_currency, received_currency
        );
        return Ok(None);
    }

    let amount_sats = btc_to_sats(sent_amount)?;
    let subtotal_cents = usd_to_cents(received_amount)?;
    let fee_cents = usd_to_cents(fee_amount)?;

    let provider_id = format!("river_{}_{}", timestamp.timestamp(), amount_sats);

    if transaction_exists_by_provider_id(pool.inner(), &provider_id).await? {
        println!(
            "Skipping duplicate River sell transaction with provider_id: {}",
            provider_id
        );
        return Ok(None);
    }

    let request = CreateExchangeTransactionRequest {
        r#type: TransactionType::Sell,
        amount_sats,
        subtotal_cents: Some(subtotal_cents),
        fee_cents: Some(fee_cents),
        memo: Some("River".to_string()),
        timestamp: *timestamp,
        provider_id: Some(provider_id),
    };

    let transaction = create_exchange_transaction(pool, request).await?;
    println!(
        "Created River sell transaction: {} sats for ${:.2}",
        amount_sats,
        subtotal_cents as f64 / 100.0
    );
    Ok(Some(transaction))
}

#[tauri::command]
pub async fn analyze_csv_file(file_path: String) -> Result<CsvPreview, String> {
    let content =
        std::fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let lines: Vec<&str> = content.lines().collect();

    let mut headers_line = 0;
    let mut format = "Unknown".to_string();

    for (i, line) in lines.iter().enumerate() {
        if line.contains("ID") && line.contains("Timestamp") && line.contains("Transaction Type") {
            headers_line = i;
            format = "Coinbase".to_string();
            break;
        } else if line.contains("Date")
            && line.contains("Sent Amount")
            && line.contains("Received Amount")
            && line.contains("Tag")
        {
            headers_line = i;
            format = "River".to_string();
            break;
        }
    }

    if format == "Unknown" {
        return Err("Unrecognized CSV format".to_string());
    }

    let csv_content = lines[headers_line..].join("\n");
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());

    let mut bitcoin_transactions_found = 0;
    let mut total_rows_in_file = 0;

    for result in reader.records() {
        if let Ok(record) = result {
            total_rows_in_file += 1;

            match format.as_str() {
                "Coinbase" => {
                    if let Some(asset) = record.get(3) {
                        if asset == "BTC" {
                            if let Some(tx_type) = record.get(2) {
                                if matches!(
                                    tx_type,
                                    "Buy" | "Sell" | "Advanced Trade Buy" | "Advanced Trade Sell"
                                ) {
                                    bitcoin_transactions_found += 1;
                                }
                            }
                        }
                    }
                }
                "River" => {
                    if let Some(tag) = record.get(7) {
                        if matches!(tag, "Buy" | "Sell") {
                            bitcoin_transactions_found += 1;
                        }
                    }
                }
                _ => {}
            }
        }
    }

    Ok(CsvPreview {
        format,
        bitcoin_transactions_found,
        headers_found_at_line: headers_line + 1,
        total_rows_in_file,
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
