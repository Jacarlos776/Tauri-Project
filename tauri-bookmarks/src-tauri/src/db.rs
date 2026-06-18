use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bookmark {
    pub id: i64,
    pub title: String,
    pub url: String,
    pub tags: String,
    pub read: bool,
    pub favorited: bool,
    pub created_at: String,
}

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS bookmarks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT NOT NULL,
                url         TEXT NOT NULL,
                tags        TEXT DEFAULT '',
                read        INTEGER DEFAULT 0,
                favorited   INTEGER DEFAULT 0,
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );"
        )?;
        Ok(Database { conn: Mutex::new(conn) })
    }

    pub fn add_bookmark(&self, title: &str, url: &str, tags: &str) -> Result<Bookmark> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO bookmarks (title, url, tags) VALUES (?1, ?2, ?3)",
            params![title, url, tags],
        )?;
        let id = conn.last_insert_rowid();
        Ok(conn.query_row(
            "SELECT id, title, url, tags, read, favorited, created_at FROM bookmarks WHERE id = ?1",
            params![id],
            |row| Ok(Bookmark {
                id: row.get(0)?,
                title: row.get(1)?,
                url: row.get(2)?,
                tags: row.get(3)?,
                read: row.get::<_, i32>(4)? != 0,
                favorited: row.get::<_, i32>(5)? != 0,
                created_at: row.get(6)?,
            }),
        )?)
    }

    pub fn list_bookmarks(&self) -> Result<Vec<Bookmark>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, url, tags, read, favorited, created_at FROM bookmarks ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map([], |row| Ok(Bookmark {
            id: row.get(0)?,
            title: row.get(1)?,
            url: row.get(2)?,
            tags: row.get(3)?,
            read: row.get::<_, i32>(4)? != 0,
            favorited: row.get::<_, i32>(5)? != 0,
            created_at: row.get(6)?,
        }))?;
        rows.collect()
    }

    pub fn toggle_read(&self, id: i64) -> Result<Bookmark> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE bookmarks SET read = NOT read, updated_at = datetime('now') WHERE id = ?1",
            params![id],
        )?;

        Ok(conn.query_row(
            "SELECT id, title, url, tags, read, favorited, created_at FROM bookmarks WHERE id = ?1",
            params![id],
            |row| Ok(Bookmark { 
                id: row.get(0)?,
                title: row.get(1)?,
                url: row.get(2)?,
                tags: row.get(3)?,
                read: row.get::<_, i32>(4)? != 0,
                favorited: row.get::<_, i32>(5)? != 0,
                created_at: row.get(6)?, 
        }))?)
    }

    pub fn toggle_favorite(&self, id: i64) -> Result<Bookmark> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE bookmarks SET favorited = NOT favorited, updated_at = datetime('now') WHERE id = ?1",
            params![id],
        )?;

        Ok(conn.query_row(
            "SELECT id, title, url, tags, read, favorited, created_at FROM bookmarks WHERE id = ?1",
            params![id],
            |row| Ok(Bookmark { 
                id: row.get(0)?,
                title: row.get(1)?,
                url: row.get(2)?,
                tags: row.get(3)?,
                read: row.get::<_, i32>(4)? != 0,
                favorited: row.get::<_, i32>(5)? != 0,
                created_at: row.get(6)?, 
        }))?)
    }

    pub fn delete_bookmark(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM bookmarks WHERE id = ?1", params![id],
        )?;
        Ok(())
    }

    pub fn update_bookmark(&self, id: i64, title: &str, url: &str, tags: &str) -> Result<Bookmark> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE bookmarks SET title = ?1, url = ?2, tags = ?3, updated_at = datetime('now') WHERE id = ?4",
            params![title, url, tags, id],
        )?;

        Ok(conn.query_row(
            "SELECT id, title, url, tags, read, favorited, created_at FROM bookmarks WHERE id = ?1",
            params![id],
            |row| Ok(Bookmark { 
                id: row.get(0)?,
                title: row.get(1)?,
                url: row.get(2)?,
                tags: row.get(3)?,
                read: row.get::<_, i32>(4)? != 0,
                favorited: row.get::<_, i32>(5)? != 0,
                created_at: row.get(6)?, 
        }))?)
    }
}
