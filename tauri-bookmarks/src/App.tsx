import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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

async function quickAdd(title: string, url: string, tags: string, cb: () => void) {
  await invoke("add_bookmark", { title, url, tags });
  cb();
}

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
  const [dark, setDark] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickUrl, setQuickUrl] = useState("");
  const [quickTags, setQuickTags] = useState("");

  async function load(f: Filter) {
    setBookmarks(await invoke("list_bookmarks", { filter: f }));
  }

  useEffect(() => { load(filter); }, [filter]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const unlisten = listen("open-quick-add", () => {
      setQuickTitle(""); setQuickUrl(""); setQuickTags("");
      setShowQuickAdd(true);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

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

  function btnClass(btn: Filter) {
    const active = btn === filter
      ? "bg-blue-600 text-white"
      : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200";
    return `px-3 py-1 rounded ${active} cursor-pointer`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bookmarks</h1>
          <button
            onClick={() => setDark(!dark)}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 cursor-pointer"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        <form onSubmit={add} className="flex gap-2 mb-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            required
            className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL"
            required
            className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Tags"
            className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
            Add
          </button>
        </form>

        <div className="flex gap-2 mb-4 items-center">
          <button onClick={() => setFilter("All")} className={btnClass("All")}>All</button>
          <button onClick={() => setFilter("Unread")} className={btnClass("Unread")}>Unread</button>
          <button onClick={() => setFilter("Favorites")} className={btnClass("Favorites")}>Favorites</button>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            onKeyDown={e => {
              if (e.key === "Enter" && searchQuery.trim()) {
                setFilter({ Search: searchQuery.trim() });
              }
            }}
            className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        <ul className="space-y-2">
          {bookmarks.map(b => (
            <li
              key={b.id}
              className={`p-3 border rounded dark:border-gray-700 ${b.read ? "opacity-60" : ""} bg-white dark:bg-gray-800`}
            >
              {editing === b.id ? (
                <div className="flex gap-2 flex-wrap">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="flex-1 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                  <input value={editUrl} onChange={e => setEditUrl(e.target.value)} className="flex-1 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                  <input value={editTags} onChange={e => setEditTags(e.target.value)} className="flex-1 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                  <button onClick={() => saveEdit(b.id)} className="px-3 py-1 bg-green-600 text-white rounded cursor-pointer">Save</button>
                  <button onClick={cancelEdit} className="px-3 py-1 bg-gray-400 text-white rounded cursor-pointer">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={b.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    {b.title}
                  </a>
                  {b.tags && (
                    <button
                      onClick={() => setFilter({ ByTag: b.tags })}
                      className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded cursor-pointer hover:bg-gray-300"
                    >
                      {b.tags}
                    </button>
                  )}
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => toggleRead(b.id)} className="px-2 py-1 text-sm border rounded cursor-pointer dark:border-gray-600">
                      {b.read ? "Unread" : "Read"}
                    </button>
                    <button onClick={() => toggleFavorite(b.id)} className="px-2 py-1 text-sm border rounded cursor-pointer dark:border-gray-600">
                      {b.favorited ? "★" : "☆"}
                    </button>
                    <button onClick={() => deleteBookmark(b.id)} className="px-2 py-1 text-sm border rounded text-red-500 cursor-pointer dark:border-gray-600">Delete</button>
                    <button onClick={() => startEdit(b)} className="px-2 py-1 text-sm border rounded cursor-pointer dark:border-gray-600">Edit</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Quick Add Bookmark</h2>
            <div className="flex flex-col gap-2">
              <input
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="Title"
                required
                className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                value={quickUrl}
                onChange={e => setQuickUrl(e.target.value)}
                placeholder="URL"
                required
                className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                autoFocus
              />
              <input
                value={quickTags}
                onChange={e => setQuickTags(e.target.value)}
                placeholder="Tags"
                className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (quickTitle && quickUrl) {
                      quickAdd(quickTitle, quickUrl, quickTags, () => {
                        setShowQuickAdd(false);
                        load(filter);
                      });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
