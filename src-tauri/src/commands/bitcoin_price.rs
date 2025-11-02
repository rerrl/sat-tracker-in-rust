use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BitcoinPriceResponse {
    pub success: bool,
    pub price: Option<f64>,
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
        .user_agent("SatTracker/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    let response = client
        // .get("https://dprogram.me/api/proxy/bitcoin/current-price")
        .get("http://localhost:3000/api/proxy/sat-tracker/bitcoin-price")
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
    
    Ok(price_data)
}
