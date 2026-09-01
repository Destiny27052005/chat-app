import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserPlus, MessageSquare, Phone, Video, Loader2, X, User } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ContactsView({ onStartChatWithUser, onStartCallWithUser }) {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Contact Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch registered contacts/users
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/auth/users`, {
          headers: getAuthHeaders(),
        });
        setContacts(res.data);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Search for users to add in the modal
  const handleSearchUsers = async (query) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await axios.get(`${API_BASE_URL}/auth/users?search=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders(),
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 h-full bg-[#fafafc] dark:bg-slate-950 p-6 md:p-10 overflow-y-auto transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Contacts</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Start conversations and launch voice or video calls
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition duration-150 cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Add New Contact</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Contact List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center">
            <User size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No contacts found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Click "Add New Contact" to find and chat with colleagues.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-indigo-100 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base border border-indigo-100 dark:border-indigo-900">
                        {contact.name?.charAt(0) || <User size={20} />}
                      </div>
                    )}
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{contact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onStartChatWithUser(contact)}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                    title="Send Message"
                  >
                    <MessageSquare size={18} />
                  </button>
                  {onStartCallWithUser && (
                    <>
                      <button
                        type="button"
                        onClick={() => onStartCallWithUser(contact, 'voice')}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                        title="Voice Call"
                      >
                        <Phone size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartCallWithUser(contact, 'video')}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                        title="Video Call"
                      >
                        <Video size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Contact Search Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Find & Add Contact</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setUserSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email address..."
                value={userSearchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {isSearching ? (
                <div className="py-6 flex justify-center text-indigo-600">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : userSearchQuery.trim() && searchResults.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No users match "{userSearchQuery}"</p>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="p-3 flex items-center justify-between rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {user.name?.charAt(0) || <User size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onStartChatWithUser(user);
                        setIsModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <MessageSquare size={14} />
                      <span>Chat</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}