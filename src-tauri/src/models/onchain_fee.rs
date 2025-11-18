use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OnchainFee {
    pub id: String,
    pub amount_sats: i64,
    pub memo: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub tx_hash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateOnchainFeeRequest {
    pub amount_sats: i64,
    pub memo: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub tx_hash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateOnchainFeeRequest {
    pub amount_sats: i64,
    pub memo: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub tx_hash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedOnchainFees {
    pub fees: Vec<OnchainFee>,
    pub total_count: i64,
    pub page: u32,
    pub page_size: u32,
    pub total_pages: u32,
    pub has_more: bool,
}
