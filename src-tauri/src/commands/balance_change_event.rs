use crate::models::balance_change_event::{BalanceChangeEvent, CreateBalanceChangeEventRequest, UpdateBalanceChangeEventRequest, PaginatedBalanceChangeEvents, BalanceChangeType};
use crate::models::portfolio_metrics::PortfolioMetrics;
use uuid::Uuid;
use chrono::{Utc, DateTime};
use sqlx::{SqlitePool, Row};
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
        timestamp: request.timestamp,
        created_at: Utc::now(),
    };
    
    sqlx::query(
        "INSERT INTO balance_change_events (id, amount_sats, value_cents, event_type, memo, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&event.id)
    .bind(event.amount_sats)
    .bind(event.value_cents)
    .bind(event.event_type.to_string())
    .bind(&event.memo)
    .bind(event.timestamp)
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
    page: u32,
    page_size: u32,
) -> Result<PaginatedBalanceChangeEvents, String> {
    let offset = page * page_size; // 0-based pagination
    
    // Get total count
    let total_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM balance_change_events ORDER BY timestamp DESC"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    // Get paginated events
    let events = sqlx::query_as::<_, BalanceChangeEvent>(
        "SELECT id, amount_sats, value_cents, event_type, memo, timestamp, created_at FROM balance_change_events ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    let total_pages = ((total_count as f64) / (page_size as f64)).ceil() as u32;
    let has_more = (page + 1) * page_size < total_count as u32;
    
    let result = PaginatedBalanceChangeEvents {
        events,
        total_count,
        page,
        page_size,
        total_pages,
        has_more,
    };
    
    println!("Retrieved {} balance change events (page {} of {}, has_more: {})", result.events.len(), page, total_pages, has_more);
    Ok(result)
}

#[tauri::command]
pub async fn update_balance_change_event(
    pool: State<'_, SqlitePool>,
    id: String,
    request: UpdateBalanceChangeEventRequest,
) -> Result<BalanceChangeEvent, String> {
    // Update the event
    sqlx::query(
        "UPDATE balance_change_events SET amount_sats = ?, value_cents = ?, event_type = ?, memo = ?, timestamp = ? WHERE id = ?"
    )
    .bind(request.amount_sats)
    .bind(request.value_cents)
    .bind(request.event_type.to_string())
    .bind(&request.memo)
    .bind(request.timestamp)
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    // Fetch and return the updated event
    let updated_event = sqlx::query_as::<_, BalanceChangeEvent>(
        "SELECT id, amount_sats, value_cents, event_type, memo, timestamp, created_at FROM balance_change_events WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    println!("Updated balance change event: {:?}", updated_event);
    Ok(updated_event)
}

#[tauri::command]
pub async fn delete_balance_change_event(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM balance_change_events WHERE id = ?")
        .bind(&id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;
    
    if result.rows_affected() == 0 {
        return Err("Event not found".to_string());
    }
    
    println!("Deleted balance change event with id: {}", id);
    Ok(())
}

#[tauri::command]
pub async fn get_portfolio_metrics(
    pool: State<'_, SqlitePool>,
) -> Result<PortfolioMetrics, String> {
    let row = sqlx::query(
        r#"
        SELECT 
            COALESCE(SUM(CASE WHEN event_type = 'Buy' THEN amount_sats ELSE 0 END), 0) as total_bought_sats,
            COALESCE(SUM(CASE WHEN event_type = 'Sell' THEN amount_sats ELSE 0 END), 0) as total_sold_sats,
            COALESCE(SUM(CASE WHEN event_type = 'Fee' THEN amount_sats ELSE 0 END), 0) as total_fee_sats,
            COALESCE(SUM(CASE WHEN event_type = 'Buy' AND value_cents IS NOT NULL THEN value_cents ELSE 0 END), 0) as total_invested_cents,
            COALESCE(SUM(CASE WHEN event_type = 'Sell' AND value_cents IS NOT NULL THEN value_cents ELSE 0 END), 0) as total_extracted_cents,
            COUNT(CASE WHEN event_type = 'Buy' AND value_cents IS NOT NULL THEN 1 END) as buy_count,
            COUNT(CASE WHEN event_type = 'Sell' AND value_cents IS NOT NULL THEN 1 END) as sell_count,
            COALESCE(SUM(CASE WHEN event_type = 'Buy' AND timestamp >= datetime('now', '-7 days') THEN amount_sats ELSE 0 END), 0) as sats_stacked_7d,
            COALESCE(SUM(CASE WHEN event_type = 'Buy' AND value_cents IS NOT NULL AND timestamp >= datetime('now', '-7 days') THEN value_cents ELSE 0 END), 0) as usd_invested_7d_cents,
            COALESCE(SUM(CASE WHEN event_type = 'Buy' AND timestamp >= datetime('now', '-31 days') THEN amount_sats ELSE 0 END), 0) as sats_stacked_31d,
            COALESCE(SUM(CASE WHEN event_type = 'Buy' AND value_cents IS NOT NULL AND timestamp >= datetime('now', '-31 days') THEN value_cents ELSE 0 END), 0) as usd_invested_31d_cents
        FROM balance_change_events
        "#
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let total_bought_sats: i64 = row.get("total_bought_sats");
    let total_sold_sats: i64 = row.get("total_sold_sats");
    let total_fee_sats: i64 = row.get("total_fee_sats");
    let total_invested_cents: i64 = row.get("total_invested_cents");
    let total_extracted_cents: i64 = row.get("total_extracted_cents");
    let buy_count: i64 = row.get("buy_count");
    let sell_count: i64 = row.get("sell_count");
    let sats_stacked_7d: i64 = row.get("sats_stacked_7d");
    let usd_invested_7d_cents: i64 = row.get("usd_invested_7d_cents");
    let sats_stacked_31d: i64 = row.get("sats_stacked_31d");
    let usd_invested_31d_cents: i64 = row.get("usd_invested_31d_cents");
    
    let current_sats = total_bought_sats - total_sold_sats - total_fee_sats;
    let total_sats_stacked = total_bought_sats;
    
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

    let portfolio_metrics = PortfolioMetrics {
        current_sats,
        total_sats_stacked,
        avg_buy_price,
        total_invested_cents,
        avg_sell_price,
        fiat_extracted_cents: total_extracted_cents,
        total_sats_spent: total_sold_sats + total_fee_sats,
        sats_stacked_7d,
        usd_invested_7d_cents,
        sats_stacked_31d,
        usd_invested_31d_cents,
    };

    println!("Calculated portfolio metrics: {:?}", portfolio_metrics);
    Ok(portfolio_metrics)
}

#[tauri::command]
pub async fn create_undocumented_lumpsum_events(
    pool: State<'_, SqlitePool>,
    start_date: String,
    end_date: String,
    total_sats: i64,
    total_usd_cents: i64,
    frequency: String, // "daily", "weekly", "monthly"
    memo: Option<String>,
) -> Result<Vec<BalanceChangeEvent>, String> {
    use chrono::Duration;
    use rand::Rng;
    
    let start = DateTime::parse_from_rfc3339(&start_date)
        .map_err(|e| format!("Invalid start date: {}", e))?
        .with_timezone(&Utc);
    
    let end = DateTime::parse_from_rfc3339(&end_date)
        .map_err(|e| format!("Invalid end date: {}", e))?
        .with_timezone(&Utc);
    
    if start >= end {
        return Err("Start date must be before end date".to_string());
    }
    
    // Generate auto memo if none provided
    let final_memo = memo.unwrap_or_else(|| {
        let mut rng = rand::thread_rng();
        let id: u16 = rng.gen_range(1000..=9999);
        format!("DCA {}", id)
    });
    
    // Calculate interval based on frequency
    let interval_days = match frequency.as_str() {
        "daily" => 1,
        "weekly" => 7,
        "monthly" => 30,
        _ => return Err("Invalid frequency. Use 'daily', 'weekly', or 'monthly'".to_string()),
    };
    
    // Calculate number of intervals
    let total_days = (end - start).num_days();
    let num_intervals = (total_days / interval_days).max(1);
    
    // Calculate amounts per interval
    let sats_per_interval = total_sats / num_intervals;
    let cents_per_interval = total_usd_cents / num_intervals;
    
    // Handle remainders for the last transaction
    let remaining_sats = total_sats % num_intervals;
    let remaining_cents = total_usd_cents % num_intervals;
    
    let mut created_events = Vec::new();
    let mut current_date = start;
    
    for i in 0..num_intervals {
        let is_last = i == num_intervals - 1;
        
        let amount_sats = if is_last {
            sats_per_interval + remaining_sats
        } else {
            sats_per_interval
        };
        
        let value_cents = if is_last {
            cents_per_interval + remaining_cents
        } else {
            cents_per_interval
        };
        
        let request = CreateBalanceChangeEventRequest {
            amount_sats,
            value_cents: Some(value_cents),
            event_type: BalanceChangeType::Buy,
            memo: Some(final_memo.clone()),
            timestamp: current_date,
        };
        
        match create_balance_change_event(pool.clone(), request).await {
            Ok(event) => created_events.push(event),
            Err(e) => return Err(format!("Failed to create event {}: {}", i + 1, e)),
        }
        
        current_date = current_date + Duration::days(interval_days);
    }
    
    Ok(created_events)
}
