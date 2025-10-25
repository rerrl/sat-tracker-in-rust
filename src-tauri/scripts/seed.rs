use chrono::Utc;
use rand::Rng;
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

    let event_types = [BalanceChangeType::Buy, BalanceChangeType::Sell, BalanceChangeType::Fee];
    let memos = [Some("Coffee".to_string()), Some("Gas".to_string()), None];
    let mut rng = rand::thread_rng();

    for i in 0..100 {
        let event_type = event_types[rng.gen_range(0..3)].clone();
        let amount_sats = rng.gen_range(1000..1000000);
        let value_cents = if rng.gen_bool(0.2) { None } else { Some(rng.gen_range(1000..10000)) };
        let memo = memos[rng.gen_range(0..3)].clone();

        sqlx::query(
            "INSERT INTO balance_change_events (id, amount_sats, value_cents, event_type, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(Uuid::new_v4().to_string())
        .bind(amount_sats)
        .bind(value_cents)
        .bind(event_type.to_string())
        .bind(&memo)
        .bind(Utc::now())
        .execute(&pool)
        .await?;

        if (i + 1) % 25 == 0 {
            println!("✅ Created {}/100 events", i + 1);
        }
    }

    println!("🎉 Done!");
    Ok(())
}
