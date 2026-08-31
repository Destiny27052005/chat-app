import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MessageSquare, Loader2, X, Mail } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ContactsView({ onStartChatWithUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';

        const res = await axios.get(`${API_BASE_URL}/auth/users${query}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (isMounted) {
          setUsers(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (!axios.isCancel(err) && isMounted) {
          console.error('Failed to load contacts:', err?.response?.data || err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce search requests by 300ms
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [search]);

  const handleStartChat = async (contact) => {
    try {
      setStartingChatId(contact._id);
      await onStartChatWithUser?.(contact);
    } catch (err) {
      console.error('Failed to initiate conversation:', err);
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto h-full max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Contacts Directory</h2>
            {!loading && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                {users.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect with registered users and start direct conversations
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition text-slate-700 placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600" />
          <p>Loading directory...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400 text-xs">
          <Mail size={32} className="text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600 text-sm">No contacts found</p>
          <p className="text-slate-400 mt-1">
            {search ? `No registered user matches "${search}"` : 'No other users registered in the system yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((contact) => {
            const avatarUrl =
              contact.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name || 'User')}`;
            const isBusy = startingChatId === contact._id;

            return (
              <div
                key={contact._id}
                className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 flex items-center justify-between bg-white hover:bg-slate-50/40 transition shadow-xs group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={avatarUrl}
                      alt={contact.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-100"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                        contact.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                    <span
                      className={`text-[10px] font-medium block mt-0.5 ${
                        contact.isOnline ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {contact.isOnline ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartChat(contact)}
                  disabled={isBusy}
                  className="p-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition disabled:opacity-50 shrink-0 ml-2"
                  title={`Message ${contact.name}`}
                >
                  {isBusy ? (
                    <Loader2 size={16} className="animate-spin text-indigo-600 group-hover:text-white" />
                  ) : (
                    <MessageSquare size={16} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}