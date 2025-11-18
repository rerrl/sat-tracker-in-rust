use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BitcoinTransaction {
    pub id: String,
    #[sqlx(try_from = "String")]
    pub r#type: TransactionType,
    pub amount_sats: i64,
    pub subtotal_cents: Option<i64>,
    pub fee_cents: Option<i64>,
    pub memo: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionType {
    Buy,
    Sell,
}

impl std::fmt::Display for TransactionType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TransactionType::Buy => write!(f, "buy"),
            TransactionType::Sell => write!(f, "sell"),
        }
    }
}

impl std::str::FromStr for TransactionType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "buy" => Ok(TransactionType::Buy),
            "sell" => Ok(TransactionType::Sell),
            _ => Err(format!("Invalid transaction type: {}", s)),
        }
    }
}

impl TryFrom<String> for TransactionType {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        value.parse()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBitcoinTransactionRequest {
    pub r#type: TransactionType,
    pub amount_sats: i64,
    pub subtotal_cents: Option<i64>,
    pub fee_cents: Option<i64>,
    pub memo: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateBitcoinTransactionRequest {
    pub r#type: TransactionType,
    pub amount_sats: i64,
    pub subtotal_cents: Option<i64>,
    pub fee_cents: Option<i64>,
    pub memo: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedBitcoinTransactions {
    pub transactions: Vec<BitcoinTransaction>,
    pub total_count: i64,
    pub page: u32,
    pub page_size: u32,
    pub total_pages: u32,
    pub has_more: bool,
}
