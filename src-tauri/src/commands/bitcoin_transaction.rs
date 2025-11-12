use crate::models::bitcoin_transaction::{
    BitcoinTransaction, CreateBitcoinTransactionRequest, PaginatedBitcoinTransactions,
    TransactionType, UpdateBitcoinTransactionRequest,
};
use crate::models::portfolio_metrics::PortfolioMetrics;
use chrono::{DateTime, Utc};
use sqlx::{Row, SqlitePool};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn create_bitcoin_transaction(
    pool: State<'_, SqlitePool>,
    request: CreateBitcoinTransactionRequest,
) -> Result<BitcoinTransaction, String> {
    let transaction = BitcoinTransaction {
        id: Uuid::new_v4().to_string(),
        r#type: request.r#type.clone(),
        amount_sats: request.amount_sats,
        fiat_amount_cents: request.fiat_amount_cents,
        fee_fiat_cents: request.fee_fiat_cents,
        memo: request.memo.clone(),
        timestamp: request.timestamp,
        created_at: Utc::now(),
    };

    sqlx::query(
        "INSERT INTO bitcoin_transactions (id, type, amount_sats, fiat_amount_cents, fee_fiat_cents, memo, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&transaction.id)
    .bind(transaction.r#type.to_string())
    .bind(transaction.amount_sats)
    .bind(transaction.fiat_amount_cents)
    .bind(transaction.fee_fiat_cents)
    .bind(&transaction.memo)
    .bind(transaction.timestamp)
    .bind(transaction.created_at)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    println!("Created bitcoin transaction: {:?}", transaction);
    Ok(transaction)
}

#[tauri::command]
pub async fn get_bitcoin_transactions(
    pool: State<'_, SqlitePool>,
    page: u32,
    page_size: u32,
) -> Result<PaginatedBitcoinTransactions, String> {
    let offset = page * page_size;

    let total_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM bitcoin_transactions")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    let rows = sqlx::query(
        "SELECT id, type, amount_sats, fiat_amount_cents, fee_fiat_cents, memo, timestamp, created_at FROM bitcoin_transactions ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let mut transactions = Vec::new();
    for row in rows {
        let transaction = BitcoinTransaction {
            id: row.get("id"),
            r#type: row
                .get::<String, _>("type")
                .parse()
                .map_err(|e| format!("Invalid transaction type: {}", e))?,
            amount_sats: row.get("amount_sats"),
            fiat_amount_cents: row.get("fiat_amount_cents"),
            fee_fiat_cents: row.get("fee_fiat_cents"),
            memo: row.get("memo"),
            timestamp: row.get("timestamp"),
            created_at: row.get("created_at"),
        };
        transactions.push(transaction);
    }

    let total_pages = ((total_count as f64) / (page_size as f64)).ceil() as u32;
    let has_more = (page + 1) * page_size < total_count as u32;

    let result = PaginatedBitcoinTransactions {
        transactions,
        total_count,
        page,
        page_size,
        total_pages,
        has_more,
    };

    println!(
        "Retrieved {} bitcoin transactions (page {} of {}, has_more: {})",
        result.transactions.len(),
        page,
        total_pages,
        has_more
    );
    Ok(result)
}

#[tauri::command]
pub async fn update_bitcoin_transaction(
    pool: State<'_, SqlitePool>,
    id: String,
    request: UpdateBitcoinTransactionRequest,
) -> Result<BitcoinTransaction, String> {
    sqlx::query(
        "UPDATE bitcoin_transactions SET type = ?, amount_sats = ?, fiat_amount_cents = ?, fee_fiat_cents = ?, memo = ?, timestamp = ? WHERE id = ?"
    )
    .bind(request.r#type.to_string())
    .bind(request.amount_sats)
    .bind(request.fiat_amount_cents)
    .bind(request.fee_fiat_cents)
    .bind(&request.memo)
    .bind(request.timestamp)
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let row = sqlx::query(
        "SELECT id, type, amount_sats, fiat_amount_cents, fee_fiat_cents, memo, timestamp, created_at FROM bitcoin_transactions WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let updated_transaction = BitcoinTransaction {
        id: row.get("id"),
        r#type: row
            .get::<String, _>("type")
            .parse()
            .map_err(|e| format!("Invalid transaction type: {}", e))?,
        amount_sats: row.get("amount_sats"),
        fiat_amount_cents: row.get("fiat_amount_cents"),
        fee_fiat_cents: row.get("fee_fiat_cents"),
        memo: row.get("memo"),
        timestamp: row.get("timestamp"),
        created_at: row.get("created_at"),
    };

    println!("Updated bitcoin transaction: {:?}", updated_transaction);
    Ok(updated_transaction)
}

#[tauri::command]
pub async fn delete_bitcoin_transaction(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM bitcoin_transactions WHERE id = ?")
        .bind(&id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("Transaction not found".to_string());
    }

    println!("Deleted bitcoin transaction with id: {}", id);
    Ok(())
}

#[tauri::command]
pub async fn get_portfolio_metrics(
    pool: State<'_, SqlitePool>,
) -> Result<PortfolioMetrics, String> {
    let row = sqlx::query(
        r#"
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'buy' THEN amount_sats ELSE 0 END), 0) as total_bought_sats,
            COALESCE(SUM(CASE WHEN type = 'sell' THEN amount_sats ELSE 0 END), 0) as total_sold_sats,
            COALESCE(SUM(CASE WHEN type = 'fee' THEN amount_sats ELSE 0 END), 0) as total_fee_sats,
            COALESCE(SUM(CASE WHEN type = 'buy' AND fiat_amount_cents IS NOT NULL THEN fiat_amount_cents ELSE 0 END), 0) as total_invested_cents,
            COALESCE(SUM(CASE WHEN type = 'sell' AND fiat_amount_cents IS NOT NULL THEN fiat_amount_cents ELSE 0 END), 0) as total_extracted_cents,
            COUNT(CASE WHEN type = 'buy' AND fiat_amount_cents IS NOT NULL THEN 1 END) as buy_count,
            COUNT(CASE WHEN type = 'sell' AND fiat_amount_cents IS NOT NULL THEN 1 END) as sell_count,
            COALESCE(SUM(CASE WHEN type = 'buy' AND timestamp >= datetime('now', '-7 days') THEN amount_sats ELSE 0 END), 0) as sats_stacked_7d,
            COALESCE(SUM(CASE WHEN type = 'buy' AND fiat_amount_cents IS NOT NULL AND timestamp >= datetime('now', '-7 days') THEN fiat_amount_cents ELSE 0 END), 0) as usd_invested_7d_cents,
            COALESCE(SUM(CASE WHEN type = 'buy' AND timestamp >= datetime('now', '-31 days') THEN amount_sats ELSE 0 END), 0) as sats_stacked_31d,
            COALESCE(SUM(CASE WHEN type = 'buy' AND fiat_amount_cents IS NOT NULL AND timestamp >= datetime('now', '-31 days') THEN fiat_amount_cents ELSE 0 END), 0) as usd_invested_31d_cents
        FROM bitcoin_transactions
        "#
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let total_bought_sats: i64 = row.get("total_bought_sats");
    let total_sold_sats: i64 = row.get("total_sold_sats");
    let total_fee_sats: i64 = row.get("total_fee_sats");
    let total_invested_cents: i64 = row.get("total_invested_cents");
    let total_extracted_cents: i64 = row.get("total_extracted_cents");
    let buy_count: i64 = row.get("buy_count");
    let sell_count: i64 = row.get("sell_count");
    let sats_stacked_7d: i64 = row.get("sats_stacked_7d");
    let usd_invested_7d_cents: i64 = row.get("usd_invested_7d_cents");
    let sats_stacked_31d: i64 = row.get("sats_stacked_31d");
    let usd_invested_31d_cents: i64 = row.get("usd_invested_31d_cents");

    let current_sats = total_bought_sats - total_sold_sats - total_fee_sats;
    let total_sats_stacked = total_bought_sats;

    let avg_buy_price = if buy_count > 0 && total_bought_sats > 0 {
        Some((total_invested_cents as f64 / 100.0) / (total_bought_sats as f64 / 100_000_000.0))
    } else {
        None
    };

    let avg_sell_price = if sell_count > 0 && total_sold_sats > 0 {
        Some((total_extracted_cents as f64 / 100.0) / (total_sold_sats as f64 / 100_000_000.0))
    } else {
        None
    };

    let portfolio_metrics = PortfolioMetrics {
        current_sats,
        total_sats_stacked,
        avg_buy_price,
        total_invested_cents,
        avg_sell_price,
        fiat_extracted_cents: total_extracted_cents,
        total_sats_spent: total_sold_sats + total_fee_sats,
        sats_stacked_7d,
        usd_invested_7d_cents,
        sats_stacked_31d,
        usd_invested_31d_cents,
    };

    println!("Calculated portfolio metrics: {:?}", portfolio_metrics);
    Ok(portfolio_metrics)
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
) -> Result<Vec<BitcoinTransaction>, String> {
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

        let fiat_amount_cents = if is_last {
            cents_per_interval + remaining_cents
        } else {
            cents_per_interval
        };

        let request = CreateBitcoinTransactionRequest {
            r#type: TransactionType::Buy,
            amount_sats,
            fiat_amount_cents: Some(fiat_amount_cents),
            fee_fiat_cents: Some(0),
            memo: Some(final_memo.clone()),
            timestamp: current_date,
        };

        match create_bitcoin_transaction(pool.clone(), request).await {
            Ok(transaction) => created_transactions.push(transaction),
            Err(e) => return Err(format!("Failed to create transaction {}: {}", i + 1, e)),
        }

        current_date = current_date + Duration::days(interval_days);
    }

    Ok(created_transactions)
}
