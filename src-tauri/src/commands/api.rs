use serde::{Deserialize, Serialize};

// API hostname configuration
const API_HOST: &str = "http://localhost:3000";
// const API_HOST: &str = "https://dprogram.me";

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

#[derive(Debug, Serialize, Deserialize)]
pub struct AnnouncementsResponse {
    pub latest_version: String,
    pub announcements: Vec<String>,
}

#[tauri::command]
pub async fn fetch_bitcoin_price() -> Result<BitcoinPriceResponse, String> {
    let client = reqwest::Client::builder()
        .user_agent("SatTracker/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = format!("{}/api/proxy/sat-tracker/bitcoin-price", API_HOST);
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

#[tauri::command]
pub async fn fetch_announcements() -> Result<AnnouncementsResponse, String> {
    let client = reqwest::Client::builder()
        .user_agent("SatTracker/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = format!("{}/api/proxy/sat-tracker/announcements", API_HOST);
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch announcements: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let announcements_data: AnnouncementsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(announcements_data)
}
