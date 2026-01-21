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
    // let total_events = rng.gen_range(50..=250);
    let total_events = 32;
    println!(
        "🎯 Generating {} events (including 5 initial buys)",
        total_events
    );

    // Generate onchain fee count
    let onchain_fee_count = rng.gen_range(3..=8);
    
    // Calculate event distribution (subtract 5 for initial buys and fees)
    let remaining_events = total_events - 5 - onchain_fee_count;
    let buy_count = (remaining_events as f32 * 0.85) as usize;
    let sell_count = remaining_events - buy_count;

    println!(
        "📊 Distribution: 5 initial buys + {} buys, {} sells, {} fees",
        buy_count, sell_count, onchain_fee_count
    );

    // Start with $10k Bitcoin price (in cents)
    let mut current_btc_price_cents = 1000000; // $10k in cents
    let target_btc_price_cents = 12500000; // $125k in cents
    let total_price_increase = target_btc_price_cents - current_btc_price_cents;
    let total_events_for_price = total_events as f64;
    
    println!(
        "₿ Starting BTC price: ${:.2}",
        current_btc_price_cents as f64 / 100.0
    );

    // Provider names for generating unique provider IDs
    let provider_names = ["Coinbase", "Kraken", "Strike", "River"];

    // Fee memos for onchain transactions
    let fee_memos = [
        "Lightning channel open",
        "Lightning channel close", 
        "Cold storage transfer",
        "Mining pool payout",
        "DeFi interaction",
    ];

    // Create a vector of all event types (after initial buys)
    let mut all_events = Vec::new();
    
    // Add buy events
    for _ in 0..buy_count {
        all_events.push("buy");
    }
    
    // Add sell events
    for _ in 0..sell_count {
        all_events.push("sell");
    }
    
    // Add fee events
    for _ in 0..onchain_fee_count {
        all_events.push("fee");
    }

    // Shuffle all events together
    all_events.shuffle(&mut rng);

    let mut events_created = 0;

    // Start from January 15, 2023
    let mut current_date = chrono::DateTime::parse_from_rfc3339("2023-01-15T10:00:00Z")
        .unwrap()
        .with_timezone(&Utc);

    // First, create 5 initial buy events
    println!("🚀 Creating 5 initial buy events...");
    for _i in 0..5 {
        // Calculate non-linear price progression
        let progress = (events_created + 1) as f64 / total_events_for_price;
        let base_increase = (total_price_increase as f64 * progress.powf(1.5)) / total_events_for_price;
        
        // Add some randomness (±20% of base increase)
        let randomness = rng.gen_range(0.8..=1.2);
        let price_increase = (base_increase * randomness) as i64;
        
        // Ensure we don't exceed target price
        if current_btc_price_cents + price_increase <= target_btc_price_cents {
            current_btc_price_cents += price_increase;
        } else {
            current_btc_price_cents = target_btc_price_cents;
        }

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

        let provider_id = if rng.gen_bool(0.7) {
            let provider_name = provider_names.choose(&mut rng).unwrap();
            Some(format!("{}_{}_{}_{}", provider_name.to_lowercase(), current_date.timestamp(), amount_sats, rng.gen::<u32>()))
        } else {
            None
        };

        sqlx::query(
            "INSERT INTO exchange_transactions (id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(Uuid::new_v4().to_string())
        .bind("buy")
        .bind(amount_sats)
        .bind(subtotal_cents)
        .bind(fee_cents)
        .bind(&memo)
        .bind(current_date)
        .bind(Utc::now())
        .bind(&provider_id)
        .execute(&pool)
        .await?;

        events_created += 1;

        // Add 3-5 days to current_date
        let days_to_add = rng.gen_range(3..=5);
        current_date = current_date + Duration::days(days_to_add);
    }

    // Process all events in shuffled order
    for event_type in all_events {
        match event_type {
            "buy" => {
                // Calculate non-linear price progression
                let progress = (events_created + 1) as f64 / total_events_for_price;
                let base_increase = (total_price_increase as f64 * progress.powf(1.5)) / total_events_for_price;
                
                // Add some randomness (±20% of base increase)
                let randomness = rng.gen_range(0.8..=1.2);
                let price_increase = (base_increase * randomness) as i64;
                
                // Ensure we don't exceed target price
                if current_btc_price_cents + price_increase <= target_btc_price_cents {
                    current_btc_price_cents += price_increase;
                } else {
                    current_btc_price_cents = target_btc_price_cents;
                }

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

                let provider_id = if rng.gen_bool(0.7) {
                    let provider_name = provider_names.choose(&mut rng).unwrap();
                    Some(format!("{}_{}_{}_{}", provider_name.to_lowercase(), current_date.timestamp(), amount_sats, rng.gen::<u32>()))
                } else {
                    None
                };

                sqlx::query(
                    "INSERT INTO exchange_transactions (id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind("buy")
                .bind(amount_sats)
                .bind(subtotal_cents)
                .bind(fee_cents)
                .bind(&memo)
                .bind(current_date)
                .bind(Utc::now())
                .bind(&provider_id)
                .execute(&pool)
                .await?;
            }
            "sell" => {
                // Calculate non-linear price progression
                let progress = (events_created + 1) as f64 / total_events_for_price;
                let base_increase = (total_price_increase as f64 * progress.powf(1.5)) / total_events_for_price;
                
                // Add some randomness (±20% of base increase)
                let randomness = rng.gen_range(0.8..=1.2);
                let price_increase = (base_increase * randomness) as i64;
                
                // Ensure we don't exceed target price
                if current_btc_price_cents + price_increase <= target_btc_price_cents {
                    current_btc_price_cents += price_increase;
                } else {
                    current_btc_price_cents = target_btc_price_cents;
                }

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

                let provider_id = if rng.gen_bool(0.7) {
                    let provider_name = provider_names.choose(&mut rng).unwrap();
                    Some(format!("{}_{}_{}_{}", provider_name.to_lowercase(), current_date.timestamp(), amount_sats, rng.gen::<u32>()))
                } else {
                    None
                };

                sqlx::query(
                    "INSERT INTO exchange_transactions (id, type, amount_sats, subtotal_cents, fee_cents, memo, timestamp, created_at, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind("sell")
                .bind(amount_sats)
                .bind(subtotal_cents)
                .bind(fee_cents)
                .bind(&memo)
                .bind(current_date)
                .bind(Utc::now())
                .bind(&provider_id)
                .execute(&pool)
                .await?;
            }
            "fee" => {
                let amount_sats = rng.gen_range(1000..=50000); // 1k to 50k sats
                let memo = if rng.gen_bool(0.6) {
                    Some(fee_memos.choose(&mut rng).unwrap().to_string())
                } else {
                    None
                };
                
                let tx_hash = if rng.gen_bool(0.8) {
                    // Generate a fake transaction hash
                    Some(format!("{:064x}", rng.gen::<u64>()))
                } else {
                    None
                };
                
                sqlx::query(
                    "INSERT INTO onchain_fees (id, amount_sats, memo, timestamp, created_at, tx_hash) VALUES (?, ?, ?, ?, ?, ?)"
                )
                .bind(Uuid::new_v4().to_string())
                .bind(amount_sats)
                .bind(&memo)
                .bind(current_date)
                .bind(Utc::now())
                .bind(&tx_hash)
                .execute(&pool)
                .await?;
            }
            _ => unreachable!(),
        }

        events_created += 1;

        // Add time between events (longer gaps for fees)
        let days_to_add = if event_type == "fee" {
            rng.gen_range(7..=30)
        } else {
            rng.gen_range(3..=5)
        };
        current_date = current_date + Duration::days(days_to_add);
    }

    println!(
        "₿ Final BTC price: ${:.2}",
        current_btc_price_cents as f64 / 100.0
    );

    println!("✅ Created {} total events (exchange transactions and onchain fees)", events_created);
    println!("🎉 Done!");
    Ok(())
}
