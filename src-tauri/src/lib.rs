mod models;
mod commands;
mod database;

use commands::balance_change_event::{create_balance_change_event, get_balance_change_events, update_balance_change_event, delete_balance_change_event, get_portfolio_metrics, create_undocumented_lumpsum_events};
use commands::import::import_sat_tracker_v1_data;
use commands::bitcoin_price::fetch_bitcoin_price;
use commands::encryption::{check_database_status, validate_database_password, encrypt_database, change_database_password, initialize_database_with_password};
use tauri::{Manager, Emitter, menu::{Menu, MenuItem, Submenu, PredefinedMenuItem}};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Create the menu inside setup where we have access to the app handle
            let import_item = MenuItem::with_id(app, "import_sat_tracker_v1", "Import Sat Tracker v1 Data", true, None::<&str>)?;
            let lumpsum_item = MenuItem::with_id(app, "add_undocumented_lumpsum", "Add Undocumented Lumpsum", true, None::<&str>)?;
            let encryption_item = MenuItem::with_id(app, "encryption_settings", "Database Encryption...", true, None::<&str>)?;
            let quit_item = PredefinedMenuItem::quit(app, None)?;
            let separator = PredefinedMenuItem::separator(app)?;

            let file_menu = Submenu::with_items(app, "File", true, &[
                &import_item,
                &lumpsum_item,
                &separator,
                &encryption_item,
                &separator,
                &quit_item,
            ])?;

            let menu = Menu::with_items(app, &[&file_menu])?;
            app.set_menu(menu)?;

            let _handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Don't initialize database here - wait for frontend to provide password
                // The frontend will call a separate command to initialize with password
                println!("🔐 Database initialization deferred until password provided");
            });
            Ok(())
        })
        .on_menu_event(|app, event| {
            println!("🔍 Menu event triggered: {}", event.id().as_ref());
            match event.id().as_ref() {
                "import_sat_tracker_v1" => {
                    println!("📥 Import menu item clicked!");
                    let app_handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        println!("🚀 About to emit menu event...");
                        if let Err(e) = app_handle.emit("menu_import_sat_tracker_v1", ()) {
                            eprintln!("❌ Failed to emit menu event: {}", e);
                        } else {
                            println!("✅ Menu event emitted successfully");
                        }
                    });
                }
                "add_undocumented_lumpsum" => {
                    println!("📊 Lumpsum menu item clicked!");
                    let app_handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        println!("🚀 About to emit lumpsum menu event...");
                        if let Err(e) = app_handle.emit("menu_add_undocumented_lumpsum", ()) {
                            eprintln!("❌ Failed to emit lumpsum menu event: {}", e);
                        } else {
                            println!("✅ Lumpsum menu event emitted successfully");
                        }
                    });
                }
                "encryption_settings" => {
                    println!("🔐 Encryption settings menu item clicked!");
                    let app_handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        println!("🚀 About to emit encryption settings event...");
                        if let Err(e) = app_handle.emit("menu_encryption_settings", ()) {
                            eprintln!("❌ Failed to emit encryption settings event: {}", e);
                        } else {
                            println!("✅ Encryption settings event emitted successfully");
                        }
                    });
                }
                _ => {
                    println!("🤷 Unknown menu event: {}", event.id().as_ref());
                }
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
            check_database_status,
            validate_database_password,
            encrypt_database,
            change_database_password,
            initialize_database_with_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
