import { useState, useEffect } from 'react';
import { Bookmark, Send, Trash2, Copy, Check } from 'lucide-react';

const STORAGE_KEY = 'chattr_saved_notes';

export default function SavedMessagesView() {
  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? JSON.parse(stored)
        : [
            { id: '1', text: 'Vite backend proxy: http://localhost:5000', time: '10:15 AM' },
            { id: '2', text: 'JWT secret keys setup for deployment', time: 'Yesterday' },
          ];
    } catch {
      return [];
    }
  });

  const [noteInput, setNoteInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedNotes));
  }, [savedNotes]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      text: noteInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSavedNotes((prev) => [newNote, ...prev]);
    setNoteInput('');
  };

  const handleDelete = (id) => {
    setSavedNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto h-full max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-100">
          <Bookmark size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Saved Messages & Notes</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your private cloud storage for quick notes, code snippets, and reminders</p>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1">
        {savedNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-16">
            <Bookmark size={32} className="text-slate-300 mb-2" />
            <p>No saved notes yet. Type below to save a message!</p>
          </div>
        ) : (
          savedNotes.map((note) => (
            <div
              key={note.id}
              className="group p-4 bg-slate-50 border border-slate-100 hover:border-slate-200/80 rounded-2xl transition duration-150 relative"
            >
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed pr-16">
                {note.text}
              </p>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/40">
                <span className="text-[10px] text-slate-400 font-medium">{note.time}</span>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => handleCopy(note.id, note.text)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition"
                    title="Copy note"
                  >
                    {copiedId === note.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
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

      {/* Input Composer */}
      <form onSubmit={handleSave} className="flex gap-2 shrink-0">
        <input
          type="text"
          placeholder="Write a private note or paste code..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-slate-700 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!noteInput.trim()}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold text-xs hover:bg-indigo-700 transition shadow-sm shadow-indigo-100 disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <Send size={15} />
          <span>Save</span>
        </button>
      </form>
    </div>
  );
}