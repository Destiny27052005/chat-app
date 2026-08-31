import { useState } from 'react';
import {  Plus, Hash } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function GroupsView({ rooms = [], onSelectRoom, onRoomCreated }) {
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  const groupRooms = rooms.filter((r) => r.isGroup);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms`,
        { name: groupName, isGroup: true, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRoomCreated?.(res.data);
      setShowCreate(false);
      setGroupName('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Groups & Channels</h2>
          <p className="text-xs text-slate-400 mt-0.5">Collaborate in team channels and group threads</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-100 transition"
        >
          <Plus size={16} />
          <span>New Group</span>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateGroup} className="mb-6 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
          <input
            type="text"
            placeholder="Group Name"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200/50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupRooms.map((group) => (
          <div
            key={group._id}
            onClick={() => onSelectRoom(group)}
            className="p-5 border border-slate-100 hover:border-indigo-100 rounded-2xl bg-white hover:bg-indigo-50/20 transition cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Hash size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">{group.name}</h4>
                <p className="text-[11px] text-slate-400">{group.members?.length || 0} members</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{group.description || 'No description provided.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}