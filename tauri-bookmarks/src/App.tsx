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
          <li key={b.id}>
            <a href={b.url} target="_blank" rel="noreferrer">{b.title}</a>
            {b.tags && <span> — {b.tags}</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
