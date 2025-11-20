use crate::models::exchange_transaction::{
    CreateExchangeTransactionRequest, ExchangeTransaction, PaginatedBitcoinTransactions,
    UpdateExchangeTransactionRequest,
};
use chrono::{DateTime, Utc};
use sqlx::{Row, SqlitePool};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn create_exchange_transaction(
    pool: State<'_, SqlitePool>,
    request: CreateExchangeTransactionRequest,
) -> Result<ExchangeTransaction, String> {
    let transaction = ExchangeTransaction {
        id: Uuid::new_v4().to_string(),
        r#type: request.r#type.clone(),
        amount_sats: request.amount_sats,
        subtotal_cents: request.subtotal_cents,
        fee_cents: request.fee_cents,
        memo: request.memo.clone(),
        timestamp: request.timestamp,
        created_at: Utc::now(),
        provider_id: request.provider_id.clone(),
    };

    sqlx::query(
        "INSERT INTO exchange_transactions (id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&transaction.id)
    .bind(transaction.r#type.to_string())
    .bind(transaction.amount_sats)
    .bind(transaction.subtotal_cents)
    .bind(transaction.fee_cents)
    .bind(&transaction.memo)
    .bind(transaction.timestamp)
    .bind(transaction.created_at)
    .bind(&transaction.provider_id)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    println!("Created bitcoin transaction: {:?}", transaction);
    Ok(transaction)
}

#[tauri::command]
pub async fn get_exchange_transactions(
    pool: State<'_, SqlitePool>,
    page: u32,
    page_size: u32,
) -> Result<PaginatedBitcoinTransactions, String> {
    let offset = page * page_size;

    let total_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM exchange_transactions")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    let rows = sqlx::query(
        "SELECT id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at, provider_id FROM exchange_transactions ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let mut transactions = Vec::new();
    for row in rows {
        let transaction = ExchangeTransaction {
            id: row.get("id"),
            r#type: row
                .get::<String, _>("type")
                .parse()
                .map_err(|e| format!("Invalid transaction type: {}", e))?,
            amount_sats: row.get("amount_sats"),
            subtotal_cents: row.get("subtotal_cents"),
            fee_cents: row.get("fee_cents"),
            memo: row.get("memo"),
            timestamp: row.get("timestamp"),
            created_at: row.get("created_at"),
            provider_id: row.get("provider_id"),
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
pub async fn update_exchange_transaction(
    pool: State<'_, SqlitePool>,
    id: String,
    request: UpdateExchangeTransactionRequest,
) -> Result<ExchangeTransaction, String> {
    sqlx::query(
        "UPDATE exchange_transactions SET type = ?, amount_sats = ?, subtotal_cents = ?, fee_cents = ?, memo = ?, timestamp = ?, provider_id = ? WHERE id = ?"
    )
    .bind(request.r#type.to_string())
    .bind(request.amount_sats)
    .bind(request.subtotal_cents)
    .bind(request.fee_cents)
    .bind(&request.memo)
    .bind(request.timestamp)
    .bind(&request.provider_id)
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let row = sqlx::query(
        "SELECT id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at, provider_id FROM exchange_transactions WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let updated_transaction = ExchangeTransaction {
        id: row.get("id"),
        r#type: row
            .get::<String, _>("type")
            .parse()
            .map_err(|e| format!("Invalid transaction type: {}", e))?,
        amount_sats: row.get("amount_sats"),
        subtotal_cents: row.get("subtotal_cents"),
        fee_cents: row.get("fee_cents"),
        memo: row.get("memo"),
        timestamp: row.get("timestamp"),
        created_at: row.get("created_at"),
        provider_id: row.get("provider_id"),
    };

    println!("Updated bitcoin transaction: {:?}", updated_transaction);
    Ok(updated_transaction)
}

#[tauri::command]
pub async fn delete_exchange_transaction(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM exchange_transactions WHERE id = ?")
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
