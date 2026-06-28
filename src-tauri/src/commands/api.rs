use sqlx::Row;
use sqlx::SqlitePool;
use tauri::{command, State};

use serde::{Deserialize, Serialize};

fn get_api_host() -> &'static str {
    #[cfg(debug_assertions)]
    {
        // Development: use localhost
        "http://localhost:3000"
    }
    
    #[cfg(not(debug_assertions))]
    {
        // Production: use production API
        "https://dprogram.me"
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BitcoinPriceResponse {
    pub success: bool,
    pub price: Option<f64>,
    #[serde(rename = "percentChange24hr")]                                                                                                             
    pub percent_change_24hr: Option<f64>,  
    pub cached: Option<bool>,
    #[serde(rename = "cacheAge")]
    pub cache_age: Option<u64>,
    pub timestamp: Option<u64>,
    pub stale: Option<bool>,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn fetch_bitcoin_price() -> Result<BitcoinPriceResponse, String> {
    let client = reqwest::Client::builder()
        .user_agent(format!("SatTracker/{}", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = format!("{}/api/proxy/sat-tracker/bitcoin-price", get_api_host());
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch Bitcoin price: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let price_data: BitcoinPriceResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    println!("{:?}", price_data);

    Ok(price_data)
}

fn deserialize_id_as_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de;
    struct IdStringVisitor;
    impl<'de> de::Visitor<'de> for IdStringVisitor {
        type Value = String;
        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("a string or integer")
        }
        fn visit_str<E: de::Error>(self, v: &str) -> Result<String, E> {
            Ok(v.to_string())
        }
        fn visit_i64<E: de::Error>(self, v: i64) -> Result<String, E> {
            Ok(v.to_string())
        }
        fn visit_u64<E: de::Error>(self, v: u64) -> Result<String, E> {
            Ok(v.to_string())
        }
    }
    deserializer.deserialize_any(IdStringVisitor)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BitcoinHistoricalPriceData {
    #[serde(deserialize_with = "deserialize_id_as_string")]
    pub id: String,
    #[serde(rename = "priceUsd")]
    pub price_usd: f64,
    pub datetime: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[command]
pub async fn fetch_bitcoin_historical_prices(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<BitcoinHistoricalPriceData>, String> {
    // Read the API key from the config table
    let api_key: String = sqlx::query("SELECT value FROM config WHERE key = 'dprogram_api_key'")
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| format!("Failed to read API key from config: {}", e))?
        .map(|r| r.get("value"))
        .ok_or_else(|| "No DProgram API key found in config. Add one via File → Add API Key...".to_string())?;

    println!("🔑 Retrieved API key from config, fetching historical Bitcoin prices...");

    let client = reqwest::Client::builder()
        .user_agent(format!("SatTracker/{}", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = format!("{}/api/proxy/bitcoin/price", get_api_host());
    let response = client
        .get(&url)
        .header("x-api-key", &api_key)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch historical Bitcoin prices: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        // Try to parse the error body
        let error_body: serde_json::Value = response.json().await.unwrap_or_default();
        let message = error_body
            .get("message")
            .and_then(|m| m.as_str())
            .unwrap_or("Unknown error");
        return Err(format!("HTTP {}: {}", status, message));
    }

    let prices: Vec<BitcoinHistoricalPriceData> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse historical price response: {}", e))?;

    println!("✅ Fetched {} historical Bitcoin price records", prices.len());
    println!("   First record: {:?}", prices.first());
    println!("   Last record:  {:?}", prices.last());

    Ok(prices)
}

