mod models;
mod commands;
mod database;

use commands::balance_change_event::{create_balance_change_event, get_balance_change_events, update_balance_change_event, delete_balance_change_event};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let pool = database::init_database().await.expect("Failed to initialize database");
                handle.manage(pool);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_balance_change_event,
            get_balance_change_events,
            update_balance_change_event,
            delete_balance_change_event
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
