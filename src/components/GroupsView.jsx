import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Hash,
  Search,
  Check,
  Camera,
  Loader2,
  Users,
  X
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function GroupsView({ rooms = [], onSelectRoom, onRoomCreated }) {
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Contact list for member selection
  const [contacts, setContacts] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch available contacts when opening modal
  useEffect(() => {
    if (!showCreate) return;

    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const res = await axios.get(`${API_BASE_URL}/auth/users`, {
          headers: getAuthHeaders(),
        });
        setContacts(res.data);
      } catch (err) {
        console.error('Failed to load contacts for group creation:', err);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [showCreate]);

  const handleToggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingAvatar(true);
      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      setGroupAvatar(res.data.url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      setCreatingGroup(true);
      setError('');

      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms`,
        {
          name: groupName.trim(),
          isGroup: true,
          description: description.trim(),
          avatar: groupAvatar || undefined,
          members: selectedMembers,
        },
        { headers: getAuthHeaders() }
      );

      onRoomCreated?.(res.data);
      setShowCreate(false);
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setGroupAvatar('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const groupRooms = rooms.filter((r) => {
    const matchesGroup = r.isGroup;
    const matchesSearch = searchQuery
      ? r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto h-full max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Groups & Channels</h2>
          <p className="text-xs text-slate-400 mt-0.5">Collaborate in team channels and project spaces</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Filter channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 transition"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-100 transition shrink-0"
          >
            <Plus size={16} />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Group Card Grid */}
      {groupRooms.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-16">
          <Hash size={36} className="text-slate-300 mb-2" />
          <p>No group channels found</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Create your first channel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupRooms.map((group) => (
            <div
              key={group._id}
              onClick={() => onSelectRoom(group)}
              className="p-5 border border-slate-100 hover:border-indigo-200 rounded-2xl bg-white hover:bg-indigo-50/20 transition cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  {group.avatar ? (
                    <img
                      src={group.avatar}
                      alt={group.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center justify-center font-bold shrink-0">
                      <Hash size={20} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">{group.name}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users size={12} />
                      <span>{group.members?.length || 0} participants</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {group.description || 'No description provided.'}
                </p>
              </div>

              {group.lastMessage?.content && (
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-50">{group.lastMessage.content}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Group */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800">Create Channel or Group</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Avatar Selector */}
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer overflow-hidden relative shrink-0"
                >
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="Group Avatar" className="w-full h-full object-cover" />
                  ) : uploadingAvatar ? (
                    <Loader2 size={18} className="animate-spin text-indigo-600" />
                  ) : (
                    <Camera size={18} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Channel Icon</p>
                  <p className="text-[11px] text-slate-400">Optional image avatar</p>
                </div>
              </div>

              {/* Name & Details */}
              <input
                type="text"
                placeholder="Channel Name (e.g. #marketing)"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <textarea
                placeholder="Channel Purpose / Description..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              {/* Member Selection */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Add Members ({selectedMembers.length} selected)
                </p>

                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {loadingContacts ? (
                    <div className="py-4 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
                      <Loader2 size={14} className="animate-spin text-indigo-600" />
                      Loading contacts...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-xs">No registered contacts found</div>
                  ) : (
                    contacts.map((contact) => {
                      const isSelected = selectedMembers.includes(contact._id);
                      return (
                        <div
                          key={contact._id}
                          onClick={() => handleToggleMember(contact._id)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                            isSelected ? 'bg-indigo-50 border border-indigo-100' : 'bg-white hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`}
                              alt={contact.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{contact.name}</p>
                              <p className="text-[10px] text-slate-400">{contact.email}</p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                              isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !groupName.trim()}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingGroup ? <Loader2 size={14} className="animate-spin" /> : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}