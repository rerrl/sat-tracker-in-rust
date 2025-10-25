use crate::models::balance_change_event::{BalanceChangeEvent, CreateBalanceChangeEventRequest, PaginatedBalanceChangeEvents};
use uuid::Uuid;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn create_balance_change_event(
    pool: State<'_, SqlitePool>,
    request: CreateBalanceChangeEventRequest,
) -> Result<BalanceChangeEvent, String> {
    let event = BalanceChangeEvent {
        id: Uuid::new_v4().to_string(),
        amount_sats: request.amount_sats,
        value_cents: request.value_cents,
        event_type: request.event_type,
        memo: request.memo,
        created_at: Utc::now(),
    };
    
    sqlx::query(
        "INSERT INTO balance_change_events (id, amount_sats, value_cents, event_type, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&event.id)
    .bind(event.amount_sats)
    .bind(event.value_cents)
    .bind(event.event_type.to_string())
    .bind(&event.memo)
    .bind(event.created_at)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    println!("Created balance change event: {:?}", event);
    Ok(event)
}

#[tauri::command]
pub async fn get_balance_change_events(
    pool: State<'_, SqlitePool>,
    page: u32,
    page_size: u32,
) -> Result<PaginatedBalanceChangeEvents, String> {
    let offset = page * page_size; // 0-based pagination
    
    // Get total count
    let total_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM balance_change_events"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    // Get paginated events
    let events = sqlx::query_as::<_, BalanceChangeEvent>(
        "SELECT id, amount_sats, value_cents, event_type, memo, created_at FROM balance_change_events ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    let total_pages = ((total_count as f64) / (page_size as f64)).ceil() as u32;
    let has_more = (page + 1) * page_size < total_count as u32;
    
    let result = PaginatedBalanceChangeEvents {
        events,
        total_count,
        page,
        page_size,
        total_pages,
        has_more,
    };
    
    println!("Retrieved {} balance change events (page {} of {}, has_more: {})", result.events.len(), page, total_pages, has_more);
    Ok(result)
}
