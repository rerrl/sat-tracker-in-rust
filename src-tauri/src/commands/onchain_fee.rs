use crate::models::onchain_fee::{
    OnchainFee, CreateOnchainFeeRequest, UpdateOnchainFeeRequest, PaginatedOnchainFees,
};
use chrono::Utc;
use sqlx::{Row, SqlitePool};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn create_onchain_fee(
    pool: State<'_, SqlitePool>,
    request: CreateOnchainFeeRequest,
) -> Result<OnchainFee, String> {
    let fee = OnchainFee {
        id: Uuid::new_v4().to_string(),
        amount_sats: request.amount_sats,
        memo: request.memo.clone(),
        timestamp: request.timestamp,
        created_at: Utc::now(),
        tx_hash: request.tx_hash.clone(),
    };

    sqlx::query(
        "INSERT INTO onchain_fees (id, amount_sats, memo, timestamp, created_at, tx_hash) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&fee.id)
    .bind(fee.amount_sats)
    .bind(&fee.memo)
    .bind(fee.timestamp)
    .bind(fee.created_at)
    .bind(&fee.tx_hash)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    println!("Created onchain fee: {:?}", fee);
    Ok(fee)
}

#[tauri::command]
pub async fn get_onchain_fees(
    pool: State<'_, SqlitePool>,
    page: u32,
    page_size: u32,
) -> Result<PaginatedOnchainFees, String> {
    let offset = page * page_size;

    let total_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM onchain_fees")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    let rows = sqlx::query(
        "SELECT id, amount_sats, memo, timestamp, created_at, tx_hash FROM onchain_fees ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let mut fees = Vec::new();
    for row in rows {
        let fee = OnchainFee {
            id: row.get("id"),
            amount_sats: row.get("amount_sats"),
            memo: row.get("memo"),
            timestamp: row.get("timestamp"),
            created_at: row.get("created_at"),
            tx_hash: row.get("tx_hash"),
        };
        fees.push(fee);
    }

    let total_pages = ((total_count as f64) / (page_size as f64)).ceil() as u32;
    let has_more = (page + 1) * page_size < total_count as u32;

    let result = PaginatedOnchainFees {
        fees,
        total_count,
        page,
        page_size,
        total_pages,
        has_more,
    };

    println!(
        "Retrieved {} onchain fees (page {} of {}, has_more: {})",
        result.fees.len(),
        page,
        total_pages,
        has_more
    );
    Ok(result)
}

#[tauri::command]
pub async fn update_onchain_fee(
    pool: State<'_, SqlitePool>,
    id: String,
    request: UpdateOnchainFeeRequest,
) -> Result<OnchainFee, String> {
    sqlx::query(
        "UPDATE onchain_fees SET amount_sats = ?, memo = ?, timestamp = ?, tx_hash = ? WHERE id = ?"
    )
    .bind(request.amount_sats)
    .bind(&request.memo)
    .bind(request.timestamp)
    .bind(&request.tx_hash)
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let row = sqlx::query(
        "SELECT id, amount_sats, memo, timestamp, created_at, tx_hash FROM onchain_fees WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let updated_fee = OnchainFee {
        id: row.get("id"),
        amount_sats: row.get("amount_sats"),
        memo: row.get("memo"),
        timestamp: row.get("timestamp"),
        created_at: row.get("created_at"),
        tx_hash: row.get("tx_hash"),
    };

    println!("Updated onchain fee: {:?}", updated_fee);
    Ok(updated_fee)
}

#[tauri::command]
pub async fn delete_onchain_fee(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM onchain_fees WHERE id = ?")
        .bind(&id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("Onchain fee not found".to_string());
    }

    println!("Deleted onchain fee with id: {}", id);
    Ok(())
}
