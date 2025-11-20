use crate::models::overview::OverviewMetrics;
use sqlx::{Row, SqlitePool};
use tauri::State;

#[tauri::command]
pub async fn get_overview_metrics(
    pool: State<'_, SqlitePool>,
) -> Result<OverviewMetrics, String> {
    // Query exchange transactions (no more fee type)
    let exchange_row = sqlx::query(
        r#"
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'buy' THEN amount_sats ELSE 0 END), 0) as total_bought_sats,
            COALESCE(SUM(CASE WHEN type = 'sell' THEN amount_sats ELSE 0 END), 0) as total_sold_sats,
            COALESCE(SUM(CASE WHEN type = 'buy' AND subtotal_cents IS NOT NULL THEN subtotal_cents ELSE 0 END), 0) as total_invested_cents,
            COALESCE(SUM(CASE WHEN type = 'sell' AND subtotal_cents IS NOT NULL THEN subtotal_cents ELSE 0 END), 0) as total_extracted_cents,
            COUNT(CASE WHEN type = 'buy' AND subtotal_cents IS NOT NULL THEN 1 END) as buy_count,
            COUNT(CASE WHEN type = 'sell' AND subtotal_cents IS NOT NULL THEN 1 END) as sell_count,
            COALESCE(SUM(CASE WHEN type = 'buy' AND timestamp >= datetime('now', '-7 days') THEN amount_sats ELSE 0 END), 0) as sats_stacked_7d,
            COALESCE(SUM(CASE WHEN type = 'buy' AND subtotal_cents IS NOT NULL AND timestamp >= datetime('now', '-7 days') THEN subtotal_cents ELSE 0 END), 0) as usd_invested_7d_cents,
            COALESCE(SUM(CASE WHEN type = 'buy' AND timestamp >= datetime('now', '-31 days') THEN amount_sats ELSE 0 END), 0) as sats_stacked_31d,
            COALESCE(SUM(CASE WHEN type = 'buy' AND subtotal_cents IS NOT NULL AND timestamp >= datetime('now', '-31 days') THEN subtotal_cents ELSE 0 END), 0) as usd_invested_31d_cents
        FROM exchange_transactions
        "#
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    // Query onchain fees
    let fees_row = sqlx::query(
        "SELECT COALESCE(SUM(amount_sats), 0) as total_onchain_fees_paid FROM onchain_fees"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let total_bought_sats: i64 = exchange_row.get("total_bought_sats");
    let total_sold_sats: i64 = exchange_row.get("total_sold_sats");
    let total_invested_cents: i64 = exchange_row.get("total_invested_cents");
    let total_extracted_cents: i64 = exchange_row.get("total_extracted_cents");
    let buy_count: i64 = exchange_row.get("buy_count");
    let sell_count: i64 = exchange_row.get("sell_count");
    let sats_stacked_7d: i64 = exchange_row.get("sats_stacked_7d");
    let usd_invested_7d_cents: i64 = exchange_row.get("usd_invested_7d_cents");
    let sats_stacked_31d: i64 = exchange_row.get("sats_stacked_31d");
    let usd_invested_31d_cents: i64 = exchange_row.get("usd_invested_31d_cents");
    let total_onchain_fees_paid_sats: i64 = fees_row.get("total_onchain_fees_paid");

    let current_sats = total_bought_sats - total_sold_sats - total_onchain_fees_paid_sats;
    let total_sats_stacked = total_bought_sats;
    let total_sats_spent = total_sold_sats + total_onchain_fees_paid_sats;

    let avg_buy_price = if buy_count > 0 && total_bought_sats > 0 {
        Some((total_invested_cents as f64 / 100.0) / (total_bought_sats as f64 / 100_000_000.0))
    } else {
        None
    };

    let avg_sell_price = if sell_count > 0 && total_sold_sats > 0 {
        Some((total_extracted_cents as f64 / 100.0) / (total_sold_sats as f64 / 100_000_000.0))
    } else {
        None
    };

    let overview_metrics = OverviewMetrics {
        current_sats,
        total_sats_stacked,
        avg_buy_price,
        total_invested_cents,
        avg_sell_price,
        fiat_extracted_cents: total_extracted_cents,
        total_sats_spent,
        total_onchain_fees_paid_sats,
        sats_stacked_7d,
        usd_invested_7d_cents,
        sats_stacked_31d,
        usd_invested_31d_cents,
    };

    println!("Calculated overview metrics: {:?}", overview_metrics);
    Ok(overview_metrics)
}
