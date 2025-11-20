use crate::models::unified_events::{UnifiedEvent, PaginatedUnifiedEvents};
use sqlx::{Row, SqlitePool};
use tauri::State;

#[tauri::command]
pub async fn get_unified_events(
    pool: State<'_, SqlitePool>,
    page: u32,
    page_size: u32,
) -> Result<PaginatedUnifiedEvents, String> {
    let offset = page * page_size;

    // Get total count
    let total_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM (
            SELECT id FROM exchange_transactions
            UNION ALL
            SELECT id FROM onchain_fees
        )"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    // Get paginated results
    let rows = sqlx::query(
        "SELECT 
            id,
            'exchange_transaction' as record_type,
            amount_sats,
            subtotal_cents,
            fee_cents,
            memo,
            timestamp,
            created_at,
            provider_id,
            NULL as tx_hash,
            type as transaction_type
        FROM exchange_transactions
        
        UNION ALL
        
        SELECT 
            id,
            'onchain_fee' as record_type,
            amount_sats,
            NULL as subtotal_cents,
            NULL as fee_cents,
            memo,
            timestamp,
            created_at,
            NULL as provider_id,
            tx_hash,
            'fee' as transaction_type
        FROM onchain_fees
        
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?"
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let mut events = Vec::new();
    for row in rows {
        let event = UnifiedEvent {
            id: row.get("id"),
            record_type: row.get("record_type"),
            amount_sats: row.get("amount_sats"),
            memo: row.get("memo"),
            timestamp: row.get("timestamp"),
            created_at: row.get("created_at"),
            subtotal_cents: row.get("subtotal_cents"),
            fee_cents: row.get("fee_cents"),
            provider_id: row.get("provider_id"),
            transaction_type: row.get("transaction_type"),
            tx_hash: row.get("tx_hash"),
        };
        events.push(event);
    }

    let total_pages = ((total_count as f64) / (page_size as f64)).ceil() as u32;
    let has_more = (page + 1) * page_size < total_count as u32;

    let result = PaginatedUnifiedEvents {
        events,
        total_count,
        page,
        page_size,
        total_pages,
        has_more,
    };

    println!(
        "Retrieved {} unified events (page {} of {}, has_more: {})",
        result.events.len(),
        page,
        total_pages,
        has_more
    );
    Ok(result)
}
