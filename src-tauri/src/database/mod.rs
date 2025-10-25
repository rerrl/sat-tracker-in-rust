use sqlx::{SqlitePool, migrate::MigrateDatabase, Sqlite};
use std::path::PathBuf;

pub async fn init_database() -> Result<SqlitePool, sqlx::Error> {
    let db_path = get_database_path();
    let db_url = format!("sqlite:{}", db_path.display());
    
    println!("🗄️  Database path: {}", db_path.display());
    println!("🔗 Database URL: {}", db_url);
    
    // Create database if it doesn't exist
    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        println!("📝 Database doesn't exist, creating new database...");
        Sqlite::create_database(&db_url).await?;
        println!("✅ Database created successfully");
    } else {
        println!("✅ Database already exists");
    }
    
    println!("🔌 Connecting to database...");
    let pool = SqlitePool::connect(&db_url).await?;
    println!("✅ Connected to database");
    
    // Run migrations
    println!("🚀 Running migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("✅ Migrations completed");
    
    println!("🎉 Database initialization complete!");
    Ok(pool)
}

fn get_database_path() -> PathBuf {
    #[cfg(debug_assertions)]
    {
        // Development: use project's db folder
        let mut path = std::env::current_dir().unwrap();
        path.push("db");
        std::fs::create_dir_all(&path).ok(); // Create db folder if it doesn't exist
        path.push("sat_tracker.db");
        path
    }
    
    #[cfg(not(debug_assertions))]
    {
        // Production: use ~/.sat-tracker-in-rust/
        let mut path = dirs::home_dir().unwrap_or_else(|| std::env::current_dir().unwrap());
        path.push(".sat-tracker-in-rust");
        std::fs::create_dir_all(&path).ok(); // Create directory if it doesn't exist
        path.push("sat_tracker.db");
        path
    }
}
