import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bookmark, Send, Trash2, Copy, Check, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SavedMessagesView() {
  const [savedNotes, setSavedNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch saved notes from MongoDB
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/notes`, {
          headers: getAuthHeaders(),
        });
        setSavedNotes(res.data);
      } catch (err) {
        console.error('Failed to load saved notes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!noteInput.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const res = await axios.post(
        `${API_BASE_URL}/notes`,
        { text: noteInput.trim() },
        { headers: getAuthHeaders() }
      );
      setSavedNotes((prev) => [res.data, ...prev]);
      setNoteInput('');
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('Could not save note to the cloud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/notes/${id}`, {
        headers: getAuthHeaders(),
      });
      setSavedNotes((prev) => prev.filter((note) => note._id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 bg-[#fafafc] dark:bg-slate-950 flex flex-col p-6 md:p-10 overflow-y-auto h-full max-w-4xl mx-auto w-full transition-colors">
      <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
          <Bookmark size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Saved Messages & Notes</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Cloud-synced private notes accessible across all your devices
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs py-16">
            <Loader2 size={24} className="animate-spin text-indigo-600 mb-2" />
            <p>Loading your saved notes...</p>
          </div>
        ) : savedNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs py-16">
            <Bookmark size={36} className="text-slate-300 dark:text-slate-700 mb-2" />
            <p>No saved notes yet. Type below to save a message!</p>
          </div>
        ) : (
          savedNotes.map((note) => (
            <div
              key={note._id}
              className="group p-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-slate-700 rounded-2xl shadow-xs transition duration-150 relative"
            >
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pr-16 font-normal">
                {note.text}
              </p>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium font-mono">
                  {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => handleCopy(note._id, note.text)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Copy note"
                  >
                    {copiedId === note._id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSave} className="flex gap-2.5 shrink-0">
        <input
          type="text"
          placeholder="Write a private note or paste code..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-xs"
        />
        <button
          type="submit"
          disabled={!noteInput.trim() || isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold text-xs transition shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:hover:bg-indigo-600 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          <span>Save</span>
        </button>
      </form>
    </div>
  );
}