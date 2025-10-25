use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BalanceChangeEvent {
    pub id: String,
    pub amount_sats: i64,
    pub value_cents: Option<i64>,
    pub event_type: BalanceChangeType,
    pub memo: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BalanceChangeType {
    Buy,
    Sell,
    Fee,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBalanceChangeEventRequest {
    pub amount_sats: i64,
    pub value_cents: Option<i64>,
    pub event_type: BalanceChangeType,
    pub memo: Option<String>,
}
