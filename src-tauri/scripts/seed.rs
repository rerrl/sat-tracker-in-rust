use chrono::Utc;
use rand::Rng;
use rand::seq::SliceRandom;
use sqlx::{SqlitePool, migrate::MigrateDatabase, Sqlite};
use uuid::Uuid;

#[derive(Debug, Clone)]
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
    println!("🎯 Generating {} events", total_events);

    // Calculate event distribution
    let buy_count = (total_events as f32 * 0.75) as usize;
    let sell_count = (total_events as f32 * 0.15) as usize;
    let fee_count = total_events - buy_count - sell_count;

    println!("📊 Distribution: {} buys, {} sells, {} fees", buy_count, sell_count, fee_count);

    // Start with $30k Bitcoin price (in cents)
    let mut current_btc_price_cents = 3000000; // $30k in cents
    println!("₿ Starting BTC price: ${:.2}", current_btc_price_cents as f64 / 100.0);

    // Create a vector of event types based on distribution
    let mut event_types = Vec::new();
    for _ in 0..buy_count {
        event_types.push("Buy");
    }
    for _ in 0..sell_count {
        event_types.push("Sell");
    }
    for _ in 0..fee_count {
        event_types.push("Fee");
    }

    // Shuffle the event types to spread them out randomly
    event_types.shuffle(&mut rng);

    let mut events_created = 0;

    // Create events in shuffled order
    for event_type in event_types {
        // Increase Bitcoin price by $500-$2000 for each event
        let price_increase = rng.gen_range(50000..=200000); // $500-$2000 in cents
        current_btc_price_cents += price_increase;
        
        match event_type {
            "Buy" => {
                let amount_sats = rng.gen_range(5000..=1000000);
                let value_cents = (amount_sats as f64 / 100_000_000.0 * current_btc_price_cents as f64) as i64;
                let memo = if rng.gen_bool(0.3) { Some("DCA".to_string()) } else { None };

                sqlx::query(
                    "INSERT INTO balance_change_events (id, amount_sats, value_cents, event_type, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind(amount_sats)
                .bind(value_cents)
                .bind("Buy")
                .bind(&memo)
                .bind(Utc::now())
                .execute(&pool)
                .await?;
            },
            "Sell" => {
                let amount_sats = rng.gen_range(5000..=1000000);
                let value_cents = (amount_sats as f64 / 100_000_000.0 * current_btc_price_cents as f64) as i64;
                let memo = if rng.gen_bool(0.4) { Some("Emergency".to_string()) } else { None };

                sqlx::query(
                    "INSERT INTO balance_change_events (id, amount_sats, value_cents, event_type, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind(amount_sats)
                .bind(value_cents)
                .bind("Sell")
                .bind(&memo)
                .bind(Utc::now())
                .execute(&pool)
                .await?;
            },
            "Fee" => {
                let amount_sats = rng.gen_range(100..=10000);
                let memo = if rng.gen_bool(0.5) { Some("Network fee".to_string()) } else { None };

                sqlx::query(
                    "INSERT INTO balance_change_events (id, amount_sats, value_cents, event_type, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind(amount_sats)
                .bind(0)
                .bind("Fee")
                .bind(&memo)
                .bind(Utc::now())
                .execute(&pool)
                .await?;
            },
            _ => unreachable!(),
        }

        events_created += 1;
    }

    println!("₿ Final BTC price: ${:.2}", current_btc_price_cents as f64 / 100.0);

    println!("✅ Created {} total events", events_created);

    println!("🎉 Done!");
    Ok(())
}
