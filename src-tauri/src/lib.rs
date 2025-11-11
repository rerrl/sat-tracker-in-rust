mod models;
mod commands;
mod database;

use commands::balance_change_event::{create_balance_change_event, get_balance_change_events, update_balance_change_event, delete_balance_change_event, get_portfolio_metrics, create_undocumented_lumpsum_events};
use commands::import::import_sat_tracker_v1_data;
use commands::api::{fetch_bitcoin_price, fetch_announcements};
use commands::encryption::{check_database_status, validate_database_password, encrypt_database, change_database_password, initialize_database_with_password};
use commands::activity_metrics::get_activity_metrics;
use commands::csv_import::{import_csv_data, analyze_csv_file};
use tauri::{Emitter, menu::{Menu, MenuItem, Submenu, PredefinedMenuItem}, AppHandle};

// Add these helper functions before the main run() function
fn create_full_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let import_item = MenuItem::with_id(app, "import_sat_tracker_v1", "Import Sat Tracker v1 Data", true, None::<&str>)?;
    let csv_import_item = MenuItem::with_id(app, "import_csv", "Import CSV Data", true, None::<&str>)?;
    let lumpsum_item = MenuItem::with_id(app, "add_undocumented_lumpsum", "Add Undocumented Lumpsum", true, None::<&str>)?;
    let encryption_item = MenuItem::with_id(app, "encryption_settings", "Database Encryption...", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let file_menu = Submenu::with_items(app, "File", true, &[
        &import_item,
        &csv_import_item,
        &lumpsum_item,
        &separator,
        &encryption_item,
        &separator,
        &quit_item,
    ])?;

    Ok(Menu::with_items(app, &[&file_menu])?)
}

fn create_minimal_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let file_menu = Submenu::with_items(app, "File", true, &[&quit_item])?;
    Ok(Menu::with_items(app, &[&file_menu])?)
}

#[tauri::command]
async fn update_menu_for_database_status(app: AppHandle, is_unlocked: bool) -> Result<(), String> {
    let menu = if is_unlocked {
        create_full_menu(&app).map_err(|e| e.to_string())?
    } else {
        create_minimal_menu(&app).map_err(|e| e.to_string())?
    };
    
    app.set_menu(menu).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Set initial minimal menu
            let menu = create_minimal_menu(app.handle()).expect("Failed to create minimal menu");
            app.set_menu(menu).expect("Failed to set menu");
            
            let _handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Don't initialize database here - wait for frontend to provide password
                // The frontend will rely on menu events and commands
                println!("🔐 Database initialization deferred until password provided");
            });
            Ok(())
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "import_sat_tracker_v1" => {
                    app.emit("menu-import-v1", ()).unwrap();
                }
                "import_csv" => {
                    app.emit("menu-import-csv", ()).unwrap();
                }
                "add_undocumented_lumpsum" => {
                    app.emit("menu-add-lumpsum", ()).unwrap();
                }
                "encryption_settings" => {
                    app.emit("menu-encryption-settings", ()).unwrap();
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            create_balance_change_event,
            get_balance_change_events,
            update_balance_change_event,
            delete_balance_change_event,
            get_portfolio_metrics,
            import_sat_tracker_v1_data,
            create_undocumented_lumpsum_events,
            fetch_bitcoin_price,
            fetch_announcements,
            check_database_status,
            validate_database_password,
            encrypt_database,
            change_database_password,
            initialize_database_with_password,
            update_menu_for_database_status,
            get_activity_metrics,
            import_csv_data,
            analyze_csv_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
