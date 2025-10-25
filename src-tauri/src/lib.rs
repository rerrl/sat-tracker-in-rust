mod models;
mod commands;

use commands::balance_change_event::{create_balance_change_event, get_balance_change_events};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_balance_change_event,
            get_balance_change_events
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
