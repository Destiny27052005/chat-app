import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MessageSquare, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ContactsView({ onStartChatWithUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/auth/users${search ? `?search=${search}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [search]);

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Contacts Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Find people across your organization and start direct chats</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
          Loading contacts...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center p-12 text-slate-400 text-xs">No contacts found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((contact) => (
            <div
              key={contact._id}
              className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 flex items-center justify-between bg-white shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
                      contact.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{contact.name}</h4>
                  <p className="text-[11px] text-slate-400">{contact.email}</p>
                </div>
              </div>
              <button
                onClick={() => onStartChatWithUser(contact)}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition"
                title="Direct Message"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}