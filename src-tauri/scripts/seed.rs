use chrono::{Duration, Utc};
use rand::seq::SliceRandom;
use rand::Rng;
use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use uuid::Uuid;

#[derive(Debug, Clone)]
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

async fn init_database() -> Result<SqlitePool, sqlx::Error> {
    let mut path = std::env::current_dir().unwrap();
    path.push("db");
    std::fs::create_dir_all(&path).ok();
    path.push("sat_tracker.db");

    let db_url = format!("sqlite:{}", path.display());

    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        Sqlite::create_database(&db_url).await?;
    }

    let pool = SqlitePool::connect(&db_url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🌱 Starting database seeding...");

    let pool = init_database().await?;

    let mut rng = rand::thread_rng();

    // Generate a random number of events between 50 and 250
    let total_events = rng.gen_range(50..=250);
    println!(
        "🎯 Generating {} events (including 5 initial buys)",
        total_events
    );

    // Calculate event distribution (subtract 5 for initial buys)
    let remaining_events = total_events - 5;
    let buy_count = (remaining_events as f32 * 0.75) as usize;
    let sell_count = (remaining_events as f32 * 0.15) as usize;
    let fee_count = remaining_events - buy_count - sell_count;

    println!(
        "📊 Distribution: 5 initial buys + {} buys, {} sells, {} fees",
        buy_count, sell_count, fee_count
    );

    // Start with $30k Bitcoin price (in cents)
    let mut current_btc_price_cents = 3000000; // $30k in cents
    println!(
        "₿ Starting BTC price: ${:.2}",
        current_btc_price_cents as f64 / 100.0
    );

    // Create a vector of event types based on distribution
    let mut event_types = Vec::new();
    for _ in 0..buy_count {
        event_types.push("buy");
    }
    for _ in 0..sell_count {
        event_types.push("sell");
    }

    // Shuffle the event types to spread them out randomly
    event_types.shuffle(&mut rng);

    let mut events_created = 0;

    // Start from January 15, 2023
    let mut current_date = chrono::DateTime::parse_from_rfc3339("2023-01-15T10:00:00Z")
        .unwrap()
        .with_timezone(&Utc);

    // First, create 5 initial buy events
    println!("🚀 Creating 5 initial buy events...");
    for i in 0..5 {
        // Increase Bitcoin price by $500-$2000 for each event
        let price_increase = rng.gen_range(50000..=200000); // $500-$2000 in cents
        current_btc_price_cents += price_increase;

        // Generate a rounded dollar amount (in hundreds)
        let dollar_amount = rng.gen_range(1..=50) * 100; // $100 to $5000 in $100 increments
        let subtotal_cents = dollar_amount * 100; // Convert to cents
        let amount_sats =
            ((subtotal_cents as f64 / current_btc_price_cents as f64) * 100_000_000.0) as i64;

        // Calculate fee (0.5-1.5% of fiat amount)
        let fee_percentage = rng.gen_range(0.5..=1.5);
        let fee_cents = (subtotal_cents as f64 * fee_percentage / 100.0) as i64;

        let memo = if rng.gen_bool(0.3) {
            Some("DCA".to_string())
        } else {
            None
        };

        sqlx::query(
            "INSERT INTO exchange_transactions (id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(Uuid::new_v4().to_string())
        .bind("buy")
        .bind(amount_sats)
        .bind(subtotal_cents)
        .bind(fee_cents)
        .bind(&memo)
        .bind(current_date)
        .bind(Utc::now())
        .execute(&pool)
        .await?;

        events_created += 1;

        // Add 3-5 days to current_date
        let days_to_add = rng.gen_range(3..=5);
        current_date = current_date + Duration::days(days_to_add);
    }

    // Create events in shuffled order
    for event_type in event_types {
        // Increase Bitcoin price by $500-$2000 for each event
        let price_increase = rng.gen_range(50000..=200000); // $500-$2000 in cents
        current_btc_price_cents += price_increase;

        match event_type {
            "buy" => {
                // Generate a rounded dollar amount (in hundreds)
                let dollar_amount = rng.gen_range(1..=50) * 100; // $100 to $5000 in $100 increments
                let subtotal_cents = dollar_amount * 100; // Convert to cents
                let amount_sats = ((subtotal_cents as f64 / current_btc_price_cents as f64)
                    * 100_000_000.0) as i64;

                // Calculate fee (0.5-1.5% of fiat amount)
                let fee_percentage = rng.gen_range(0.5..=1.5);
                let fee_cents = (subtotal_cents as f64 * fee_percentage / 100.0) as i64;

                let memo = if rng.gen_bool(0.3) {
                    Some("DCA".to_string())
                } else {
                    None
                };

                sqlx::query(
                    "INSERT INTO exchange_transactions (id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind("buy")
                .bind(amount_sats)
                .bind(subtotal_cents)
                .bind(fee_cents)
                .bind(&memo)
                .bind(current_date)
                .bind(Utc::now())
                .execute(&pool)
                .await?;
            }
            "sell" => {
                // Generate a rounded dollar amount (in hundreds)
                let dollar_amount = rng.gen_range(1..=50) * 100; // $100 to $5000 in $100 increments
                let subtotal_cents = dollar_amount * 100; // Convert to cents
                let amount_sats = ((subtotal_cents as f64 / current_btc_price_cents as f64)
                    * 100_000_000.0) as i64;

                // Calculate fee (0.5-1.5% of fiat amount)
                let fee_percentage = rng.gen_range(0.5..=1.5);
                let fee_cents = (subtotal_cents as f64 * fee_percentage / 100.0) as i64;

                let memo = if rng.gen_bool(0.4) {
                    Some("Emergency".to_string())
                } else {
                    None
                };

                sqlx::query(
                    "INSERT INTO exchange_transactions (id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind("sell")
                .bind(amount_sats)
                .bind(subtotal_cents)
                .bind(fee_cents)
                .bind(&memo)
                .bind(current_date)
                .bind(Utc::now())
                .execute(&pool)
                .await?;
            }
            _ => unreachable!(),
        }

        events_created += 1;

        // Add 3-5 days to current_date
        let days_to_add = rng.gen_range(3..=5);
        current_date = current_date + Duration::days(days_to_add);
    }

    println!(
        "₿ Final BTC price: ${:.2}",
        current_btc_price_cents as f64 / 100.0
    );

    println!("✅ Created {} total events", events_created);

    println!("🎉 Done!");
    Ok(())
}
