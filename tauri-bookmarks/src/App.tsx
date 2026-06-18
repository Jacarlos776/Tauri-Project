import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type Bookmark = {
  id: number;
  title: string;
  url: string;
  tags: string;
  read: boolean;
  favorited: boolean;
  created_at: string;
};

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editTags, setEditTags] = useState("");

  async function load() {
    setBookmarks(await invoke("list_bookmarks"));
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await invoke("add_bookmark", { title, url, tags });
    setTitle(""); setUrl(""); setTags("");
    load();
  }

  async function toggleRead(id: number) {
    await invoke("toggle_read", { id });
    load();
  }

  async function toggleFavorite(id: number) {
    await invoke("toggle_favorite", { id });
    load();
  }

  async function deleteBookmark(id: number) {
    await invoke("delete_bookmark", { id });
    load();
  }

  function startEdit(b: Bookmark) {
    setEditing(b.id);
    setEditTitle(b.title);
    setEditUrl(b.url);
    setEditTags(b.tags);
  }

  async function saveEdit(id: number) {
    await invoke("update_bookmark", { id, title: editTitle, url: editUrl, tags: editTags });
    setEditing(null);
    load();
  }

  function cancelEdit() {
    setEditing(null);
  }

  return (
    <main>
      <h1>Bookmarks</h1>
      <form onSubmit={add}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" required />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma-separated)" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {bookmarks.map(b => (
          <li key={b.id} style={{ opacity: b.read ? 0.6 : 1 }}>
            {editing === b.id ? (
              <div>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                <input value={editUrl} onChange={e => setEditUrl(e.target.value)} />
                <input value={editTags} onChange={e => setEditTags(e.target.value)} />
                <button onClick={() => saveEdit(b.id)}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </div>
            ) : (
              <div>
                <a href={b.url} target="_blank" rel="noreferrer">{b.title}</a>
                {b.tags && <span> — {b.tags}</span>}
                <button onClick={() => toggleRead(b.id)}>{b.read ? "Unread" : "Read"}</button>
                <button onClick={() => toggleFavorite(b.id)}>{b.favorited ? "★" : "☆"}</button>
                <button onClick={() => deleteBookmark(b.id)}>Delete</button>
                <button onClick={() => startEdit(b)}>Edit</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
