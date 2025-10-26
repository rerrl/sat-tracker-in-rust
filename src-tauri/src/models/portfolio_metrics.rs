use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PortfolioMetrics {
    pub current_sats: i64,
    pub total_sats_stacked: i64,
    pub avg_buy_price: Option<f64>,
    pub total_invested_cents: i64,
    pub avg_sell_price: Option<f64>,
    pub fiat_extracted_cents: i64,
    pub total_sats_spent: i64,
}
