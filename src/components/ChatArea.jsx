import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Users, Search, Phone, Video, MoreVertical, Paperclip,
  Smile, Send, CheckCheck, Download, Trash2, FileText, Loader2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ChatArea({ activeRoom, currentUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  // 1. Fetch Room History & Manage Room Socket Subscriptions
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
          setMessages(res.data);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      } catch (err) {
        console.error('Failed to load messages:', err?.response?.data || err.message);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };

    fetchMessages();

    // Join room channel
    socket.emit('join_room', activeRoom._id);

    // 2. Real-time Listeners
    const handleReceiveMessage = (newMsg) => {
      const incomingRoomId = newMsg.roomId || newMsg.room;
      if (incomingRoomId === activeRoom._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
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

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      isMounted = false;
      socket.emit('leave_room', activeRoom._id);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [activeRoom?._id, socket]);

  // Scroll down whenever messages list changes
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // 3. Send Message
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeRoom?._id) return;

    const payload = {
      _id: `temp-${Date.now()}`,
      roomId: activeRoom._id,
      senderId: currentUser._id,
      sender: currentUser,
      content: inputMessage.trim(),
      file: null,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, payload]);
    
    // Emit to backend
    socket.emit('send_message', {
      roomId: activeRoom._id,
      senderId: currentUser._id,
      content: inputMessage.trim(),
      file: null
    });

    setInputMessage('');
  };

  // 4. Handle File Upload
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
          'Content-Type': 'multipart/form-data'
        }
      });

      const filePayload = {
        name: res.data.name || file.name,
        url: res.data.url,
        size: res.data.size || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileType: res.data.fileType || file.type
      };

      const optimisticMsg = {
        _id: `temp-${Date.now()}`,
        roomId: activeRoom._id,
        senderId: currentUser._id,
        sender: currentUser,
        content: '',
        file: filePayload,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      socket.emit('send_message', {
        roomId: activeRoom._id,
        senderId: currentUser._id,
        content: '',
        file: filePayload
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
    socket.emit('delete_message', {
      messageId,
      roomId: activeRoom._id
    });

    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted', file: null }
          : m
      )
    );
  };

  if (!activeRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
        <p className="text-sm font-medium">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fafafc] h-full overflow-hidden">
      {/* Top Header */}
      <div className="h-16 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {activeRoom.avatar ? (
            <img src={activeRoom.avatar} className="w-10 h-10 rounded-full object-cover" alt={activeRoom.name} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-800">{activeRoom.name || 'Chat'}</h3>
            <p className="text-xs text-slate-400">{activeRoom.members?.length || 0} members</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button className="hover:text-slate-600 transition p-1"><Search size={18} /></button>
          <button className="hover:text-slate-600 transition p-1"><Phone size={18} /></button>
          <button className="hover:text-slate-600 transition p-1"><Video size={18} /></button>
          <button className="hover:text-slate-600 transition p-1"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex justify-center">
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Conversation History
          </span>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-6 text-slate-400 gap-2 items-center text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            Loading messages...
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender?._id || msg.senderId || msg.sender;
            const isMe = senderId === currentUser._id;

            return (
              <div key={msg._id} className={`flex gap-3 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <img
                    src={msg.sender?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender?.name || 'User'}`}
                    className="w-8 h-8 rounded-full object-cover self-end mb-1"
                    alt={msg.sender?.name || 'Sender'}
                  />
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {!isMe && (
                    <span className="text-[11px] font-semibold text-indigo-600 mb-1">
                      {msg.sender?.name || 'User'}
                    </span>
                  )}

                  <div
                    className={`relative p-3.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-indigo-50/70 text-slate-800 rounded-br-none border border-indigo-100/50'
                        : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
                    } ${msg.isDeleted ? 'italic text-slate-400' : ''}`}
                  >
                    {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}

                    {/* File Attachment Card */}
                    {msg.file?.url && (
                      <div className="mt-2 flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xs">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{msg.file.name}</p>
                            <p className="text-[10px] text-slate-400">{msg.file.size}</p>
                          </div>
                        </div>
                        <a
                          href={msg.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    )}

                    {/* Message Delete Action */}
                    {isMe && !msg.isDeleted && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition"
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Metadata (Time & Read Status) */}
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[10px] text-slate-400">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                    {isMe && <CheckCheck size={14} className="text-indigo-600" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-2xl px-3 py-2">
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
            className="text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
            title="Attach file"
          >
            {uploading ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Paperclip size={18} />}
          </button>

          <input
            type="text"
            placeholder={uploading ? "Uploading file..." : "Type a message..."}
            value={inputMessage}
            disabled={uploading}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700"
          />

          <button type="button" className="text-slate-400 hover:text-slate-600 transition">
            <Smile size={18} />
          </button>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || uploading}
            className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}