mod db;

use db::{Bookmark, Database, Filter};
use tauri::{Emitter, Manager, State};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};

#[tauri::command]
fn add_bookmark(db: State<Database>, title: String, url: String, tags: String) -> Result<Bookmark, String> {
    db.add_bookmark(&title, &url, &tags).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_bookmarks(db: State<Database>, filter: Filter) -> Result<Vec<Bookmark>, String> {
    db.list_bookmarks(filter).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_read(db: State<Database>, id: i64) -> Result<Bookmark, String> {
    db.toggle_read(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_favorite(db: State<Database>, id:i64) -> Result<Bookmark, String> {
    db.toggle_favorite(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_bookmark(db: State<Database>, id:i64) -> Result<(), String> {
    db.delete_bookmark(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_bookmark(db: State<Database>, id:i64, title: String, url: String, tags: String) -> Result<Bookmark, String> {
    db.update_bookmark(id, &title, &url, &tags).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(|app, shortcut, event| {
            if event.state == ShortcutState::Pressed
                && shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyB)
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().ok();
                    window.set_focus().ok();
                    window.emit("open-quick-add", ()).ok();
                }
            }
        }).build())
        .setup(|app| {
            let db_path = app.path().app_data_dir()
                .expect("Failed to get app data dir")
                .join("bookmarks.db");
            std::fs::create_dir_all(db_path.parent().unwrap()).ok();
            let db = Database::new(db_path.to_str().unwrap())
                .expect("Failed to open database");
            app.manage(db);

            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                window.show().ok();
                                window.set_focus().ok();
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                })
                .build(app)?;

            app.global_shortcut().register("Ctrl+Shift+B")?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![add_bookmark, list_bookmarks, toggle_read, toggle_favorite, delete_bookmark, update_bookmark])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
