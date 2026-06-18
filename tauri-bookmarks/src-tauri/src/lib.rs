mod db;

use db::{Bookmark, Database};
use tauri::State;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn add_bookmark(db: State<Database>, title: String, url: String, tags: String) -> Result<Bookmark, String> {
    db.add_bookmark(&title, &url, &tags).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_bookmarks(db: State<Database>) -> Result<Vec<Bookmark>, String> {
    db.list_bookmarks().map_err(|e| e.to_string())
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
    let db = Database::new("bookmarks.db").expect("Failed to open database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![greet, add_bookmark, list_bookmarks, toggle_read, toggle_favorite, delete_bookmark, update_bookmark])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
