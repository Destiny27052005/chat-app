import { useState } from 'react';
import { Bookmark, Send } from 'lucide-react';

export default function SavedMessagesView() {
  const [savedNotes, setSavedNotes] = useState([
    { id: '1', text: 'Vite backend proxy: http://localhost:5000', time: '10:15 AM' },
    { id: '2', text: 'JWT secret keys setup for deployment', time: 'Yesterday' },
  ]);
  const [noteInput, setNoteInput] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    setSavedNotes([
      ...savedNotes,
      {
        id: Date.now().toString(),
        text: noteInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNoteInput('');
  };

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
          <Bookmark size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Saved Messages & Notes</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your private cloud storage for quick notes and snippets</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4">
        {savedNotes.map((note) => (
          <div key={note.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-800">
            <p>{note.text}</p>
            <span className="block text-[10px] text-slate-400 mt-2 text-right">{note.time}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSave} className="flex gap-2">
        <input
          type="text"
          placeholder="Write a private note..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-xs hover:bg-indigo-700 transition"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}