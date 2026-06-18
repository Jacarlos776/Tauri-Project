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

type Filter = "All" | "Unread" | "Favorites" | { ByTag: string } | { Search: string };

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editTags, setEditTags] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  async function load(f: Filter) {
    setBookmarks(await invoke("list_bookmarks", { filter: f }));
  }

  useEffect(() => { load(filter); }, [filter]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await invoke("add_bookmark", { title, url, tags });
    setTitle(""); setUrl(""); setTags("");
    load(filter);
  }

  async function toggleRead(id: number) {
    await invoke("toggle_read", { id });
    load(filter);
  }

  async function toggleFavorite(id: number) {
    await invoke("toggle_favorite", { id });
    load(filter);
  }

  async function deleteBookmark(id: number) {
    await invoke("delete_bookmark", { id });
    load(filter);
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
    load(filter);
  }

  function cancelEdit() {
    setEditing(null);
  }

  function activeFilter(btn: Filter) {
    return btn === filter ? { fontWeight: "bold" as const } : {};
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
      <div>
        <button onClick={() => setFilter("All")} style={activeFilter("All")}>All</button>
        <button onClick={() => setFilter("Unread")} style={activeFilter("Unread")}>Unread</button>
        <button onClick={() => setFilter("Favorites")} style={activeFilter("Favorites")}>Favorites</button>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search..."
          onKeyDown={e => {
            if (e.key === "Enter" && searchQuery.trim()) {
              setFilter({ Search: searchQuery.trim() });
            }
          }}
        />
      </div>
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
                {b.tags && (
                  <>
                    {" — "}
                    <button onClick={() => setFilter({ ByTag: b.tags })} style={{ background: "none", border: "none", color: "#646cff", cursor: "pointer", padding: 0 }}>
                      {b.tags}
                    </button>
                  </>
                )}
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
