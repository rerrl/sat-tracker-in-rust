use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BalanceChangeEvent {
    pub id: String,
    pub amount_sats: i64,
    pub value_cents: Option<i64>,
    #[sqlx(try_from = "String")]
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

impl std::fmt::Display for BalanceChangeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BalanceChangeType::Buy => write!(f, "Buy"),
            BalanceChangeType::Sell => write!(f, "Sell"),
            BalanceChangeType::Fee => write!(f, "Fee"),
        }
    }
}

impl std::str::FromStr for BalanceChangeType {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Buy" => Ok(BalanceChangeType::Buy),
            "Sell" => Ok(BalanceChangeType::Sell),
            "Fee" => Ok(BalanceChangeType::Fee),
            _ => Err(format!("Invalid event type: {}", s)),
        }
    }
}

impl TryFrom<String> for BalanceChangeType {
    type Error = String;
    
    fn try_from(value: String) -> Result<Self, Self::Error> {
        value.parse()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBalanceChangeEventRequest {
    pub amount_sats: i64,
    pub value_cents: Option<i64>,
    pub event_type: BalanceChangeType,
    pub memo: Option<String>,
}
