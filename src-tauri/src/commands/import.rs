use tauri::State;
use sqlx::{SqlitePool, Row};

#[tauri::command]
pub async fn import_sat_tracker_v1_data(
    _pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    // Get the path to the v1 database
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let v1_db_path = home_dir.join(".sat-tracker").join("dev").join("database.sqlite");
    
    println!("🔍 Looking for v1 database at: {}", v1_db_path.display());
    
    if !v1_db_path.exists() {
        let error_msg = format!("V1 database not found at: {}", v1_db_path.display());
        println!("❌ {}", error_msg);
        return Err(error_msg);
    }
    
    // Get file size
    let metadata = std::fs::metadata(&v1_db_path).map_err(|e| format!("Failed to read file metadata: {}", e))?;
    let file_size = metadata.len();
    println!("📊 V1 Database file size: {} bytes ({:.2} KB)", file_size, file_size as f64 / 1024.0);
    
    // Connect to the v1 database
    let v1_db_url = format!("sqlite:{}", v1_db_path.display());
    let v1_pool = SqlitePool::connect(&v1_db_url).await.map_err(|e| format!("Failed to connect to v1 database: {}", e))?;
    
    // Get list of tables
    let tables_query = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
    let table_rows = sqlx::query(tables_query)
        .fetch_all(&v1_pool)
        .await
        .map_err(|e| format!("Failed to query tables: {}", e))?;
    
    println!("📋 Tables found in v1 database:");
    for row in &table_rows {
        let table_name: String = row.get("name");
        println!("  - {}", table_name);
        
        // Get row count for each table
        let count_query = format!("SELECT COUNT(*) as count FROM {}", table_name);
        if let Ok(count_row) = sqlx::query(&count_query).fetch_one(&v1_pool).await {
            let count: i64 = count_row.get("count");
            println!("    └─ {} rows", count);
        }
    }
    
    // Get schema information for each table
    println!("\n🏗️  Table schemas:");
    for row in &table_rows {
        let table_name: String = row.get("name");
        let schema_query = format!("PRAGMA table_info({})", table_name);
        
        if let Ok(schema_rows) = sqlx::query(&schema_query).fetch_all(&v1_pool).await {
            println!("  📊 Table: {}", table_name);
            for schema_row in schema_rows {
                let column_name: String = schema_row.get("name");
                let column_type: String = schema_row.get("type");
                let not_null: bool = schema_row.get("notnull");
                let pk: bool = schema_row.get("pk");
                
                let mut flags = Vec::new();
                if pk { flags.push("PK"); }
                if not_null { flags.push("NOT NULL"); }
                let flags_str = if flags.is_empty() { String::new() } else { format!(" ({})", flags.join(", ")) };
                
                println!("    └─ {}: {}{}", column_name, column_type, flags_str);
            }
        }
    }
    
    v1_pool.close().await;
    
    let summary = format!(
        "V1 Database Analysis Complete:\n- File size: {} bytes\n- Tables found: {}\n- Check console for detailed schema information",
        file_size,
        table_rows.len()
    );
    
    println!("✅ {}", summary);
    Ok(summary)
}
