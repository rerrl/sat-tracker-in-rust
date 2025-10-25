use crate::models::balance_change_event::{BalanceChangeEvent, CreateBalanceChangeEventRequest};
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
pub async fn create_balance_change_event(
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
    
    println!("Created balance change event: {:?}", event);
    Ok(event)
}

#[tauri::command]
pub async fn get_balance_change_events() -> Result<Vec<BalanceChangeEvent>, String> {
    println!("Getting balance change events (returning empty for now)");
    Ok(vec![])
}
