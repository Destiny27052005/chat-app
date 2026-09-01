import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CallModal from './CallModal.jsx';
import {
  Users,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  CheckCheck,
  Download,
  Trash2,
  FileText,
  Loader2,
  X,
  ArrowLeft,
  DownloadCloud
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎉', '👏', '🚀', '💯', '😊', '🙌', '✨', '🙏'];

export default function ChatArea({ activeRoom, currentUser, socket, onBack, onStartCall }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Top Action States
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // WebRTC Active Call State
  const [activeCallSession, setActiveCallSession] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const moreMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const formatMessageTime = (dateValue) => {
    if (!dateValue) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (typeof dateValue === 'string' && (dateValue.includes('AM') || dateValue.includes('PM'))) {
      return dateValue;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime())
      ? String(dateValue)
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Strict String ID comparison for 1-on-1 vs Group details
  const currentId = currentUser?._id?.toString();
  const otherMember = !activeRoom?.isGroup
    ? activeRoom?.members?.find((m) => {
        const mId = (m?._id || m)?.toString();
        return mId && mId !== currentId;
      })
    : null;

  const displayName = activeRoom?.isGroup
    ? activeRoom?.name
    : otherMember?.name || activeRoom?.name || 'Chat';

  const displayAvatar = activeRoom?.isGroup
    ? activeRoom?.avatar
    : otherMember?.avatar || activeRoom?.avatar;

  const isContactOnline = activeRoom?.isGroup ? false : Boolean(otherMember?.isOnline);

  // 1. Fetch Room History & Socket Subscriptions
  useEffect(() => {
    if (!activeRoom?._id) return;

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        setLoadingHistory(true);
        const res = await axios.get(`${API_BASE_URL}/chat/messages/${activeRoom._id}`, {
          headers: getAuthHeaders(),
        });
        if (isMounted) {
          setMessages(Array.isArray(res.data) ? res.data : []);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      } catch (err) {
        console.error('Failed to load messages:', err?.response?.data || err.message);
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };

    fetchMessages();

    socket?.emit('join_room', activeRoom._id);

    const handleReceiveMessage = (newMsg) => {
      const incomingRoomId = newMsg.roomId || newMsg.room;
      if (incomingRoomId === activeRoom._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev.filter((m) => !m._id.toString().startsWith('temp-')), newMsg];
        });
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted', file: null }
            : m
        )
      );
    };

    socket?.on('receive_message', handleReceiveMessage);
    socket?.on('message_deleted', handleMessageDeleted);

    return () => {
      isMounted = false;
      setShowSearch(false);
      setSearchQuery('');
      setShowMoreMenu(false);
      socket?.emit('leave_room', activeRoom._id);
      socket?.off('receive_message', handleReceiveMessage);
      socket?.off('message_deleted', handleMessageDeleted);
    };
  }, [activeRoom?._id, socket]);

  // 2. Listen for Incoming Live WebRTC Calls (if parent handler not provided)
  useEffect(() => {
    if (!socket || !activeRoom?._id || onStartCall) return;

    const handleIncomingCall = (data) => {
      if (data.roomId === activeRoom._id) {
        setActiveCallSession({
          isIncoming: true,
          type: data.type,
          roomId: data.roomId,
          signal: data.signal,
          otherUser: { name: data.callerName, avatar: displayAvatar },
        });
      }
    };

    socket.on('incoming_call', handleIncomingCall);
    return () => socket.off('incoming_call', handleIncomingCall);
  }, [socket, activeRoom?._id, displayAvatar, onStartCall]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (!showSearch) {
      scrollToBottom('smooth');
    }
  }, [messages, showSearch]);

  // 3. Send Message
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeRoom?._id) return;

    const payload = {
      _id: `temp-${Date.now()}`,
      roomId: activeRoom._id,
      room: activeRoom._id,
      sender: currentUser,
      content: inputMessage.trim(),
      file: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, payload]);

    socket?.emit('send_message', {
      roomId: activeRoom._id,
      content: inputMessage.trim(),
      file: null,
    });

    setInputMessage('');
    setShowEmojiPicker(false);
  };

  // 4. File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoom?._id) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      const filePayload = {
        name: res.data.name || file.name,
        url: res.data.url,
        size: res.data.size || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileType: res.data.fileType || file.type,
      };

      const optimisticMsg = {
        _id: `temp-${Date.now()}`,
        roomId: activeRoom._id,
        room: activeRoom._id,
        sender: currentUser,
        content: '',
        file: filePayload,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      socket?.emit('send_message', {
        roomId: activeRoom._id,
        content: '',
        file: filePayload,
      });
    } catch (err) {
      console.error('File upload failed:', err?.response?.data || err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 5. Delete Message
  const handleDeleteMessage = (messageId) => {
    socket?.emit('delete_message', {
      messageId,
      roomId: activeRoom._id,
    });

    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted', file: null }
          : m
      )
    );
  };

  // 6. Start WebRTC Voice or Video Call
  const handleStartCall = (type) => {
    if (onStartCall) {
      onStartCall(otherMember || { name: displayName, avatar: displayAvatar }, type);
      return;
    }

    setActiveCallSession({
      isIncoming: false,
      type,
      roomId: activeRoom._id,
      otherUser: {
        _id: otherMember?._id,
        name: displayName,
        avatar: displayAvatar,
      },
    });
  };

  const handleClearChat = () => {
    if (window.confirm('Clear messages from your current screen view?')) {
      setMessages([]);
      setShowMoreMenu(false);
    }
  };

  const handleExportChat = () => {
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
    link.setAttribute('download', `${displayName.replace(/\s+/g, '_')}_transcript.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowMoreMenu(false);
  };

  const displayMessages = searchQuery.trim()
    ? messages.filter(
        (m) =>
          m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.file?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (!activeRoom) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 h-full">
        <p className="text-sm font-medium">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fafafc] dark:bg-slate-950 h-full w-full overflow-hidden relative transition-colors">
      {/* Top Header */}
      <div className="h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 z-10 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition shrink-0 cursor-pointer"
            title="Back to chats"
          >
            <ArrowLeft size={19} />
          </button>

          {displayAvatar ? (
            <img src={displayAvatar} className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800" alt={displayName} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              {activeRoom.isGroup ? <Users size={18} /> : <span>{displayName.charAt(0)}</span>}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</h3>
            <p className={`text-xs ${isContactOnline ? 'text-emerald-500 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
              {activeRoom.isGroup
                ? `${activeRoom.members?.length || 0} members`
                : isContactOnline
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 md:gap-2 text-slate-500 dark:text-slate-400 shrink-0">
          <button
            type="button"
            onClick={() => setShowSearch((prev) => !prev)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showSearch ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Search in conversation"
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            onClick={() => handleStartCall('voice')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            title="Start voice call"
          >
            <Phone size={18} />
          </button>

          <button
            type="button"
            onClick={() => handleStartCall('video')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            title="Start video call"
          >
            <Video size={18} />
          </button>

          {/* More Menu Popover */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
              title="More options"
            >
              <MoreVertical size={18} />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleExportChat}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <DownloadCloud size={14} className="text-slate-400" />
                  <span>Export Transcript</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="w-full px-4 py-2 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Clear Screen View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            {searchQuery && (
              <span>
                {displayMessages.length} {displayMessages.length === 1 ? 'match' : 'matches'}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
        <div className="flex justify-center">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/70 px-3 py-1 rounded-full">
            {searchQuery ? `Searching: "${searchQuery}"` : 'Conversation History'}
          </span>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-6 text-slate-400 dark:text-slate-500 gap-2 items-center text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            Loading messages...
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-xs">
            {searchQuery
              ? 'No matching messages found.'
              : 'No messages yet. Send a message to start the conversation!'}
          </div>
        ) : (
          displayMessages.map((msg) => {
            const senderId = (msg.sender?._id || msg.senderId || msg.sender)?.toString();
            const isMe = senderId === currentId;

            return (
              <div key={msg._id} className={`flex gap-2.5 md:gap-3 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <img
                    src={
                      msg.sender?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.sender?.name || 'User')}`
                    }
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover self-end mb-1 shrink-0 border border-slate-100 dark:border-slate-800"
                    alt={msg.sender?.name || 'Sender'}
                  />
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                  {!isMe && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      {msg.sender?.name || 'User'}
                    </span>
                  )}

                  <div
                    className={`relative p-3 md:p-3.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-slate-800 dark:text-slate-100 rounded-br-none border border-indigo-100 dark:border-indigo-900/50'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-xs border border-slate-100 dark:border-slate-800'
                    } ${msg.isDeleted ? 'italic text-slate-400 dark:text-slate-500' : ''}`}
                  >
                    {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}

                    {msg.file?.url && (
                      <div className="mt-2 flex items-center justify-between p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl gap-4 md:gap-6">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{msg.file.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{msg.file.size}</p>
                          </div>
                        </div>
                        <a
                          href={msg.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    )}

                    {isMe && !msg.isDeleted && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                    {isMe && <CheckCheck size={14} className="text-indigo-600 dark:text-indigo-400" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0 relative transition-colors">
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-18 left-4 md:left-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-30 flex gap-2 flex-wrap max-w-xs animate-in zoom-in-95 duration-100"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputMessage((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-2xl px-3 py-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:opacity-50 p-1 shrink-0 cursor-pointer"
            title="Attach file"
          >
            {uploading ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Paperclip size={18} />}
          </button>

          <input
            type="text"
            placeholder={uploading ? 'Uploading file...' : 'Type a message...'}
            value={inputMessage}
            disabled={uploading}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400 min-w-0"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-1 transition rounded-lg shrink-0 cursor-pointer ${
              showEmojiPicker ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Emojis"
          >
            <Smile size={18} />
          </button>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || uploading}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/20 disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Embedded Call Modal fallback if no onStartCall prop passed */}
      {!onStartCall && activeCallSession && (
        <CallModal
          callData={activeCallSession}
          currentUser={currentUser}
          socket={socket}
          onClose={() => setActiveCallSession(null)}
        />
      )}
    </div>
  );
}