use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct OverviewMetrics {
    pub current_sats: i64,
    pub total_sats_stacked: i64,
    pub avg_buy_price: Option<f64>,
    pub total_invested_cents: i64,
    pub avg_sell_price: Option<f64>,
    pub fiat_extracted_cents: i64,
    pub total_sats_spent: i64,
    pub total_onchain_fees_paid_sats: i64,
    pub sats_stacked_7d: i64,
    pub usd_invested_7d_cents: i64,
    pub sats_stacked_31d: i64,
    pub usd_invested_31d_cents: i64,
}
