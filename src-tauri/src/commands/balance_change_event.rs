use crate::models::balance_change_event::{BalanceChangeEvent, CreateBalanceChangeEventRequest};
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
) -> Result<Vec<BalanceChangeEvent>, String> {
    let events = sqlx::query_as::<_, BalanceChangeEvent>(
        "SELECT id, amount_sats, value_cents, event_type, memo, created_at FROM balance_change_events ORDER BY created_at DESC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    println!("Retrieved {} balance change events", events.len());
    Ok(events)
}
