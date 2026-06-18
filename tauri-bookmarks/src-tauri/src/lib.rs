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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::new("bookmarks.db").expect("Failed to open database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![greet, add_bookmark, list_bookmarks])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
