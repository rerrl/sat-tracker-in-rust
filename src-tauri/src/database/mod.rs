use sqlx::{SqlitePool, migrate::MigrateDatabase, Sqlite};
use std::path::PathBuf;
use rusqlite;

pub async fn init_database_with_password(password: Option<String>) -> Result<SqlitePool, sqlx::Error> {
    let db_path = get_database_path();
    let db_url = format!("sqlite:{}", db_path.display());
    let is_encrypted = password.is_some();
    
    println!("🗄️  Database path: {}", db_path.display());
    println!("🔗 Database URL: {}", if is_encrypted { "sqlite://[ENCRYPTED]" } else { &db_url });
    
    // For encrypted databases, we need to handle them differently
    if let Some(pwd) = password {
        // Check if database exists first using rusqlite
        if !db_path.exists() {
            println!("📝 Creating new encrypted database...");
            // Create encrypted database using rusqlite
            let conn = rusqlite::Connection::open(&db_path)
                .map_err(|e| sqlx::Error::Configuration(format!("Failed to open database: {}", e).into()))?;
            conn.pragma_update(None, "key", &pwd)
                .map_err(|e| sqlx::Error::Configuration(format!("Failed to set encryption key: {}", e).into()))?;
            // Create a simple table to initialize the database
            conn.execute("CREATE TABLE IF NOT EXISTS _init (id INTEGER)", [])
                .map_err(|e| sqlx::Error::Configuration(format!("Failed to initialize database: {}", e).into()))?;
            drop(conn);
            println!("✅ Encrypted database created successfully");
        }
        
        // Connect with SQLx using custom options
        println!("🔌 Connecting to encrypted database...");
        let pool = sqlx::sqlite::SqlitePoolOptions::new()
            .after_connect(move |conn, _meta| {
                let pwd = pwd.clone();
                Box::pin(async move {
                    sqlx::query(&format!("PRAGMA key = '{}'", pwd))
                        .execute(conn)
                        .await?;
                    Ok(())
                })
            })
            .connect(&db_url)
            .await?;
        println!("✅ Connected to encrypted database");
        
        // Run migrations
        println!("🚀 Running migrations...");
        match sqlx::migrate!("./migrations").run(&pool).await {
            Ok(_) => println!("✅ Migrations completed"),
            Err(e) => {
                println!("❌ Migration failed: {}", e);
                return Err(e.into());
            }
        }
        
        println!("🎉 Encrypted database initialization complete!");
        Ok(pool)
    } else {
        // Unencrypted database - use standard approach
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
        match sqlx::migrate!("./migrations").run(&pool).await {
            Ok(_) => println!("✅ Migrations completed"),
            Err(e) => {
                println!("❌ Migration failed: {}", e);
                return Err(e.into());
            }
        }
        
        println!("🎉 Database initialization complete!");
        Ok(pool)
    }
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
