use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{command, AppHandle, State, Manager};
use sqlx::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStatus {
    pub is_encrypted: bool,
    pub needs_password: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordValidationResult {
    pub is_valid: bool,
    pub error_message: Option<String>,
}

fn get_database_path() -> PathBuf {
    #[cfg(debug_assertions)]
    {
        let mut path = std::env::current_dir().unwrap();
        path.push("db");
        std::fs::create_dir_all(&path).ok();
        path.push("sat_tracker.db");
        path
    }
    
    #[cfg(not(debug_assertions))]
    {
        let mut path = dirs::home_dir().unwrap_or_else(|| std::env::current_dir().unwrap());
        path.push(".sat-tracker-in-rust");
        std::fs::create_dir_all(&path).ok();
        path.push("sat_tracker.db");
        path
    }
}

#[command]
pub async fn check_database_status() -> Result<DatabaseStatus, String> {
    let db_path = get_database_path();
    
    // If database doesn't exist, it's not encrypted
    if !db_path.exists() {
        return Ok(DatabaseStatus {
            is_encrypted: false,
            needs_password: false,
        });
    }
    
    // Try to open without password and read from a simple table
    match Connection::open(&db_path) {
        Ok(conn) => {
            // Try to query sqlite_master - this should work on any valid SQLite database
            match conn.execute("SELECT COUNT(*) FROM sqlite_master", []) {
                Ok(_) => {
                    // Database opened successfully without password - not encrypted
                    Ok(DatabaseStatus {
                        is_encrypted: false,
                        needs_password: false,
                    })
                }
                Err(e) => {
                    // Check if the error suggests encryption
                    let error_msg = e.to_string().to_lowercase();
                    if error_msg.contains("file is not a database") || 
                       error_msg.contains("file is encrypted") ||
                       error_msg.contains("cipher") {
                        Ok(DatabaseStatus {
                            is_encrypted: true,
                            needs_password: true,
                        })
                    } else {
                        // Some other error - assume not encrypted but report the error
                        println!("⚠️ Database query failed but doesn't seem encrypted: {}", e);
                        Ok(DatabaseStatus {
                            is_encrypted: false,
                            needs_password: false,
                        })
                    }
                }
            }
        }
        Err(e) => {
            // Check if the error suggests encryption
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("encrypted") || error_msg.contains("cipher") {
                Ok(DatabaseStatus {
                    is_encrypted: true,
                    needs_password: true,
                })
            } else {
                Err(format!("Failed to check database: {}", e))
            }
        }
    }
}

#[command]
pub async fn validate_database_password(password: String) -> Result<PasswordValidationResult, String> {
    let db_path = get_database_path();
    
    if !db_path.exists() {
        return Ok(PasswordValidationResult {
            is_valid: false,
            error_message: Some("Database does not exist".to_string()),
        });
    }
    
    match Connection::open(&db_path) {
        Ok(conn) => {
            // Set the encryption key
            if let Err(e) = conn.pragma_update(None, "key", &password) {
                return Ok(PasswordValidationResult {
                    is_valid: false,
                    error_message: Some(format!("Failed to set key: {}", e)),
                });
            }
            
            // Try to read from the database
            match conn.execute("SELECT name FROM sqlite_master LIMIT 1", []) {
                Ok(_) => Ok(PasswordValidationResult {
                    is_valid: true,
                    error_message: None,
                }),
                Err(_) => Ok(PasswordValidationResult {
                    is_valid: false,
                    error_message: Some("Invalid password".to_string()),
                }),
            }
        }
        Err(e) => Err(format!("Failed to open database: {}", e)),
    }
}

#[command]
pub async fn encrypt_database(password: String) -> Result<String, String> {
    let db_path = get_database_path();
    
    if !db_path.exists() {
        return Err("Database does not exist".to_string());
    }
    
    // Check if already encrypted
    let status = check_database_status().await?;
    if status.is_encrypted {
        return Err("Database is already encrypted".to_string());
    }
    
    // Create backup path
    let backup_path = db_path.with_extension("db.backup");
    
    // Copy original to backup
    if let Err(e) = std::fs::copy(&db_path, &backup_path) {
        return Err(format!("Failed to create backup: {}", e));
    }
    
    // Open original database
    let mut source_conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open source database: {}", e))?;
    
    // Create encrypted database path
    let encrypted_path = db_path.with_extension("db.encrypted");
    
    // Create encrypted database
    let mut encrypted_conn = Connection::open(&encrypted_path)
        .map_err(|e| format!("Failed to create encrypted database: {}", e))?;
    
    // Set encryption key on new database
    encrypted_conn.pragma_update(None, "key", &password)
        .map_err(|e| format!("Failed to set encryption key: {}", e))?;
    
    // Close connections first
    drop(source_conn);
    drop(encrypted_conn);
    
    // Replace original with encrypted version
    std::fs::rename(&encrypted_path, &db_path)
        .map_err(|e| format!("Failed to replace database: {}", e))?;
    
    // Now initialize the encrypted database with SQLx (this will run migrations)
    let pool = crate::database::init_database_with_password(Some(password.clone())).await
        .map_err(|e| format!("Failed to initialize encrypted database: {}", e))?;
    
    // Now copy data from backup to the newly migrated encrypted database
    let backup_conn = Connection::open(&backup_path)
        .map_err(|e| format!("Failed to open backup database: {}", e))?;
    
    let encrypted_conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open encrypted database: {}", e))?;
    
    encrypted_conn.pragma_update(None, "key", &password)
        .map_err(|e| format!("Failed to set encryption key: {}", e))?;
    
    // Get only data from backup (tables already exist from migrations)
    let mut stmt = backup_conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_sqlx_%'")
        .map_err(|e| format!("Failed to prepare table query: {}", e))?;
    
    let table_names: Result<Vec<String>, _> = stmt.query_map([], |row| {
        Ok(row.get::<_, String>(0)?)
    }).map_err(|e| format!("Failed to query table names: {}", e))?.collect();
    
    let table_names = table_names.map_err(|e| format!("Failed to get table names: {}", e))?;
    
    // Copy data for each table
    for table_name in table_names {
        // Get all data from backup
        let mut data_stmt = backup_conn.prepare(&format!("SELECT * FROM {}", table_name))
            .map_err(|e| format!("Failed to prepare data query for {}: {}", table_name, e))?;
        
        let column_count = data_stmt.column_count();
        
        if column_count > 0 {
            let placeholders = (0..column_count).map(|_| "?").collect::<Vec<_>>().join(", ");
            let insert_query = format!("INSERT INTO {} VALUES ({})", table_name, placeholders);
            
            let data_rows = data_stmt.query_map([], |row| {
                let mut row_data = Vec::new();
                for i in 0..column_count {
                    let value: Option<String> = row.get(i).ok();
                    row_data.push(value);
                }
                Ok(row_data)
            }).map_err(|e| format!("Failed to query data for {}: {}", table_name, e))?;
            
            for row_result in data_rows {
                let row_data = row_result.map_err(|e| format!("Failed to get row data: {}", e))?;
                let params: Vec<&dyn rusqlite::ToSql> = row_data.iter()
                    .map(|v| v.as_ref().map(|s| s as &dyn rusqlite::ToSql).unwrap_or(&rusqlite::types::Null))
                    .collect();
                
                encrypted_conn.execute(&insert_query, params.as_slice())
                    .map_err(|e| format!("Failed to insert data into {}: {}", table_name, e))?;
            }
        }
    }
    
    
    // Remove backup on success
    std::fs::remove_file(&backup_path).ok();
    
    Ok("Database encrypted successfully".to_string())
}

#[command]
pub async fn change_database_password(old_password: String, new_password: String) -> Result<String, String> {
    let db_path = get_database_path();
    
    if !db_path.exists() {
        return Err("Database does not exist".to_string());
    }
    
    // Validate old password first
    let validation = validate_database_password(old_password.clone()).await?;
    if !validation.is_valid {
        return Err("Invalid current password".to_string());
    }
    
    // Open database with old password
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    conn.pragma_update(None, "key", &old_password)
        .map_err(|e| format!("Failed to set old key: {}", e))?;
    
    // Change to new password
    conn.pragma_update(None, "rekey", &new_password)
        .map_err(|e| format!("Failed to change password: {}", e))?;
    
    Ok("Password changed successfully".to_string())
}

#[command]
pub async fn initialize_database_with_password(
    app_handle: AppHandle,
    password: Option<String>
) -> Result<String, String> {
    use crate::database;
    
    let pool = database::init_database_with_password(password).await
        .map_err(|e| format!("Failed to initialize database: {}", e))?;
    
    app_handle.manage(pool);
    
    Ok("Database initialized successfully".to_string())
}
