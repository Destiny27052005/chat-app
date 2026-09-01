import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Users,
  UserPlus,
  Search,
  Bell,
  BellOff,
  MoreVertical,
  FileText,
  Pin,
  ChevronRight,
  X,
  Loader2,
  Download,
  Copy,
  DownloadCloud,
  Check,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DetailsSidebar({ activeRoom, currentUser, onRoomUpdated }) {
  const [isMuted, setIsMuted] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [actionMemberId, setActionMemberId] = useState(null);

  // Modals & Popovers
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Media state
  const [roomMedia, setRoomMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const moreMenuRef = useRef(null);

  const isGroup = Boolean(activeRoom?.isGroup);
  const roomId = activeRoom?._id;
  const memberList = useMemo(() => activeRoom?.members || [], [activeRoom?.members]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch available contacts not currently in this group
  useEffect(() => {
    if (!showAddMember || !isGroup || !roomId) return;

    let isMounted = true;

    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const res = await axios.get(`${API_BASE_URL}/auth/users`, {
          headers: getAuthHeaders(),
        });

        if (isMounted) {
          const currentMemberIds = new Set(
            memberList.map((m) => (typeof m === 'object' ? m._id?.toString() : m?.toString()))
          );
          setAvailableContacts(res.data.filter((u) => !currentMemberIds.has(u._id?.toString())));
        }
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        if (isMounted) {
          setLoadingContacts(false);
        }
      }
    };

    fetchContacts();

    return () => {
      isMounted = false;
    };
  }, [showAddMember, isGroup, roomId, memberList]);

  // 2. Fetch shared files and attachments when Media modal is opened
  useEffect(() => {
    if (!showMediaModal || !roomId) return;

    let isMounted = true;

    const fetchMedia = async () => {
      try {
        setLoadingMedia(true);
        const res = await axios.get(`${API_BASE_URL}/chat/messages/${roomId}`, {
          headers: getAuthHeaders(),
        });

        if (isMounted) {
          const messages = Array.isArray(res.data) ? res.data : [];
          const files = messages
            .filter((m) => m.file && m.file.url)
            .map((m) => ({
              _id: m._id,
              ...m.file,
              sender: m.sender?.name || 'User',
              createdAt: m.createdAt,
            }));
          setRoomMedia(files);
        }
      } catch (err) {
        console.error('Failed to load media files:', err);
      } finally {
        if (isMounted) {
          setLoadingMedia(false);
        }
      }
    };

    fetchMedia();

    return () => {
      isMounted = false;
    };
  }, [showMediaModal, roomId]);

  if (!activeRoom) return null;

  // Resolve direct contact details using string IDs
  const currentId = currentUser?._id?.toString();
  const otherMember = !isGroup
    ? memberList.find((m) => {
        const mId = (m?._id || m)?.toString();
        return mId && mId !== currentId;
      })
    : null;

  const roomName = isGroup
    ? activeRoom.name || 'Group Conversation'
    : otherMember?.name || activeRoom.name || 'Direct Conversation';

  const roomAvatar = isGroup
    ? activeRoom.avatar
    : otherMember?.avatar || activeRoom.avatar;

  const isOnline = isGroup ? false : Boolean(otherMember?.isOnline);
  const userAbout = otherMember?.about || otherMember?.bio || activeRoom.description || 'Hey there! I am using Chattr.';

  // Actions
  const handleAddMember = async (userId) => {
    try {
      setActionMemberId(userId);
      const res = await axios.put(
        `${API_BASE_URL}/chat/rooms/${activeRoom._id}/members`,
        { userId },
        { headers: getAuthHeaders() }
      );

      onRoomUpdated?.(res.data);
      setAvailableContacts((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Failed to add member:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Could not add member to this group.');
    } finally {
      setActionMemberId(null);
    }
  };

  const handleCopyEmailOrId = () => {
    const textToCopy = otherMember?.email || activeRoom._id;
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    setShowMoreMenu(false);
  };

  const handleExportTranscript = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/messages/${activeRoom._id}`, {
        headers: getAuthHeaders(),
      });
      const messages = Array.isArray(res.data) ? res.data : [];
      const transcript = messages
        .map(
          (m) =>
            `[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.name || 'User'}: ${
              m.content || m.file?.name || ''
            }`
        )
        .join('\n');

      const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${roomName.replace(/\s+/g, '_')}_transcript.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowMoreMenu(false);
    } catch (err) {
      console.error('Export transcript error:', err);
      alert('Could not export transcript');
    }
  };

  const filteredContacts = availableContacts.filter((contact) =>
    contact.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto shrink-0 select-none h-full relative transition-colors">
      <div>
        {/* Contact / Room Header */}
        <div className="flex flex-col items-center text-center mb-6">
          {roomAvatar ? (
            <img
              src={roomAvatar}
              alt={roomName}
              className="w-16 h-16 rounded-2xl object-cover mb-3 shadow-md border border-slate-100 dark:border-slate-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-indigo-600/20 text-xl">
              {isGroup ? <Users size={28} /> : <span>{roomName.charAt(0)}</span>}
            </div>
          )}

          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug truncate max-w-full px-2">
            {roomName}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {isGroup
              ? `${memberList.length} members`
              : isOnline
              ? 'Active now'
              : 'Offline'}
          </p>
        </div>

        {/* Action Controls */}
        <div className={`grid ${isGroup ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-6`}>
          {isGroup && (
            <button
              type="button"
              onClick={() => {
                setContactSearch('');
                setShowAddMember(true);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <UserPlus size={16} />
              </div>
              <span className="text-[11px] font-medium">Add</span>
            </button>
          )}

          {/* Quick Search */}
          <button
            type="button"
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder*="Search in this conversation"]');
              if (searchInput) {
                searchInput.focus();
              } else {
                const searchToggle = document.querySelector('button[title="Search in conversation"]');
                searchToggle?.click();
              }
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <Search size={16} />
            </div>
            <span className="text-[11px] font-medium">Search</span>
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition cursor-pointer ${
              isMuted
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
            </div>
            <span className="text-[11px] font-medium">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {/* More Options */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="w-full flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <MoreVertical size={16} />
              </div>
              <span className="text-[11px] font-medium">More</span>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 bottom-12 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleCopyEmailOrId}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium cursor-pointer"
                >
                  {copiedText ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
                  <span>{copiedText ? 'Copied!' : isGroup ? 'Copy Room ID' : 'Copy Email'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportTranscript}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <DownloadCloud size={14} className="text-slate-400" />
                  <span>Export Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="mb-6">
          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
            {isGroup ? 'Description' : 'About'}
          </h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed wrap-break-word">
            {userAbout}
          </p>
        </div>

        {/* Interactive Drawers */}
        <div className="space-y-1 mb-6 border-t border-b border-slate-100 dark:border-slate-800 py-3">
          {/* Media, Links & Docs */}
          <div
            onClick={() => setShowMediaModal(true)}
            className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition group"
          >
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
              <span>Media, Links, and Docs</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Pinned Messages */}
          <div
            onClick={() => setShowPinnedModal(true)}
            className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition group"
          >
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
              <span>Pinned Messages</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>0</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Notification Quick Toggle */}
          <div
            onClick={() => setIsMuted((prev) => !prev)}
            className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition group"
          >
            <div className="flex items-center gap-2">
              {isMuted ? (
                <BellOff size={16} className="text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Bell size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
              )}
              <span>Notifications</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span className={isMuted ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
                {isMuted ? 'Muted' : 'On'}
              </span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Group Members List */}
        {isGroup && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">Members</h5>
              <span className="text-xs text-slate-400 dark:text-slate-500">{memberList.length}</span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {memberList.map((member) => {
                const memberObj = typeof member === 'object' ? member : { _id: member };
                const memberId = memberObj._id?.toString();
                const isAdmin = activeRoom.admins?.some(
                  (admin) => (admin._id || admin)?.toString() === memberId
                );

                return (
                  <div key={memberId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            memberObj.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              memberObj.name || 'User'
                            )}`
                          }
                          className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                          alt={memberObj.name || 'Member'}
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 border border-white dark:border-slate-900 rounded-full ${
                            memberObj.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {memberObj.name || 'Member'}
                        </p>
                        <p className={`text-[10px] ${memberObj.isOnline ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                          {memberObj.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    {isAdmin && (
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Media, Links & Docs Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Media, Links & Documents</h4>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 mb-4 pr-1">
              {loadingMedia ? (
                <div className="py-8 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 gap-1.5">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span>Loading files...</span>
                </div>
              ) : roomMedia.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No files or documents shared in this conversation yet.
                </div>
              ) : (
                roomMedia.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        {file.fileType?.includes('image') ? <ImageIcon size={15} /> : <FileText size={15} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{file.size} • {file.sender}</p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      <Download size={15} />
                    </a>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowMediaModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pinned Messages Modal */}
      {showPinnedModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Pin size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">No Pinned Messages</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              Important messages pinned by participants will appear here.
            </p>
            <button
              type="button"
              onClick={() => setShowPinnedModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Add Member to Group</h4>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered users..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
              {loadingContacts ? (
                <div className="py-6 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 gap-1.5">
                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                  <span>Loading contacts...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  {contactSearch ? 'No users matching your search' : 'No new contacts available to add'}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          contact.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            contact.name
                          )}`
                        }
                        alt={contact.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{contact.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{contact.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMember(contact._id)}
                      disabled={actionMemberId === contact._id}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      {actionMemberId === contact._id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddMember(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}