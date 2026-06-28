use sqlx::{Row, SqlitePool};
use tauri::{command, State};

const API_KEY_CONFIG_KEY: &str = "dprogram_api_key";

#[command]
pub async fn save_api_key(pool: State<'_, SqlitePool>, api_key: String) -> Result<String, String> {
    println!("🔑 Saving API key config...");

    sqlx::query(
        "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    )
    .bind(API_KEY_CONFIG_KEY)
    .bind(&api_key)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to save API key: {}", e))?;

    println!("✅ API key saved successfully");
    Ok("API key saved successfully".to_string())
}

#[command]
pub async fn get_api_key(pool: State<'_, SqlitePool>) -> Result<Option<String>, String> {
    let row = sqlx::query("SELECT value FROM config WHERE key = ?")
        .bind(API_KEY_CONFIG_KEY)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| format!("Failed to get API key: {}", e))?;

    Ok(row.map(|r| r.get("value")))
}