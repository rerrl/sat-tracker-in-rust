use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedEvent {
    pub id: String,
    pub record_type: String, // "exchange_transaction" or "onchain_fee"
    pub amount_sats: i64,
    pub memo: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    
    // Exchange-specific fields (None for onchain fees)
    pub subtotal_cents: Option<i64>,
    pub fee_cents: Option<i64>,
    pub provider_id: Option<String>,
    pub transaction_type: Option<String>, // "buy", "sell", or "fee"
    
    // Onchain-specific fields (None for exchange transactions)
    pub tx_hash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedUnifiedEvents {
    pub events: Vec<UnifiedEvent>,
    pub total_count: i64,
    pub page: u32,
    pub page_size: u32,
    pub total_pages: u32,
    pub has_more: bool,
}
