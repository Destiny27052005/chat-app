import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    Users, Search, Phone, Video, MoreVertical, Paperclip,
    Smile, Send, CheckCheck, Download, Trash2, FileText
} from 'lucide-react';

export default function ChatArea({ activeRoom, currentUser, socket }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const formatMessageTime = (dateValue) => {
        if (!dateValue) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // If it's already a short time string (e.g., "10:24 AM"), return it directly
        if (typeof dateValue === 'string' && (dateValue.includes('AM') || dateValue.includes('PM'))) {
            return dateValue;
        }

        const date = new Date(dateValue);
        return isNaN(date.getTime())
            ? String(dateValue)
            : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Auto-scroll to bottom of thread
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };


    useEffect(() => {
        if (!activeRoom?._id) return;

        // Load message history from REST API
        axios.get(`http://localhost:5000/api/chat/messages/${activeRoom._id}`)
            .then((res) => {
                setMessages(res.data);
                scrollToBottom();
            })
            .catch((err) => console.error(err));

        // Join room via socket
        socket.emit('join_room', activeRoom._id);

        const handleReceiveMessage = (newMsg) => {
            if (newMsg.room === activeRoom._id) {
                setMessages((prev) => [...prev, newMsg]);
                scrollToBottom();
            }
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) =>
                prev.map((m) => m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted', file: null } : m)
            );
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('message_deleted', handleMessageDeleted);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [activeRoom, socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        socket.emit('send_message', {
            roomId: activeRoom._id,
            senderId: currentUser._id,
            content: inputMessage,
            file: null
        });

        setInputMessage('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const res = await axios.post('http://localhost:5000/api/upload', formData);

            socket.emit('send_message', {
                roomId: activeRoom._id,
                senderId: currentUser._id,
                content: '',
                file: {
                    name: res.data.name,
                    url: res.data.url,
                    size: res.data.size,
                    fileType: res.data.fileType
                }
            });
        } catch (err) {
            console.error('File upload failed:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteMessage = (messageId) => {
        socket.emit('delete_message', {
            messageId,
            roomId: activeRoom._id
        });
    };

    if (!activeRoom) {
        return <div className="flex-1 flex items-center justify-center text-slate-400">Select a chat to start messaging</div>;
    }

    return (
        <div className="flex-1 flex flex-col bg-[#fafafc] h-full overflow-hidden">
            {/* Header */}
            <div className="h-16 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    {activeRoom.avatar ? (
                        <img src={activeRoom.avatar} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                            <Users size={18} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">{activeRoom.name}</h3>
                        <p className="text-xs text-slate-400">{activeRoom.members?.length || 0} members</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                    <button className="hover:text-slate-600 transition"><Search size={18} /></button>
                    <button className="hover:text-slate-600 transition"><Phone size={18} /></button>
                    <button className="hover:text-slate-600 transition"><Video size={18} /></button>
                    <button className="hover:text-slate-600 transition"><MoreVertical size={18} /></button>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="flex justify-center">
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Today</span>
                </div>

                {messages.map((msg) => {
                    const isMe = (msg.sender?._id || msg.sender) === currentUser._id;

                    return (
                        <div key={msg._id} className={`flex gap-3 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <img
                                    src={msg.sender?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop'}
                                    className="w-8 h-8 rounded-full object-cover self-end mb-1"
                                    alt={msg.sender?.name}
                                />
                            )}

                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                {!isMe && (
                                    <span className="text-[11px] font-semibold text-indigo-600 mb-1">{msg.sender?.name}</span>
                                )}

                                <div
                                    className={`relative p-3.5 rounded-2xl text-sm leading-relaxed ${isMe
                                        ? 'bg-indigo-50/70 text-slate-800 rounded-br-none border border-indigo-100/50'
                                        : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
                                        } ${msg.isDeleted ? 'italic text-slate-400' : ''}`}
                                >
                                    {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}

                                    {/* Render File Card */}
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

                                    {/* Message Actions */}
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

                                {/* Metadata Row */}
                                {/* Metadata Row */}
                                <div className="flex items-center gap-1.5 mt-1 px-1">
                                    <span className="text-[10px] text-slate-400">
                                        {formatMessageTime(msg.createdAt)}
                                    </span>
                                    {isMe && <CheckCheck size={14} className="text-indigo-600" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
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
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
                    >
                        <Paperclip size={18} />
                    </button>

                    <input
                        type="text"
                        placeholder={uploading ? "Uploading file..." : "Type a message..."}
                        value={inputMessage}
                        disabled={uploading}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700"
                    />

                    <button className="text-slate-400 hover:text-slate-600 transition">
                        <Smile size={18} />
                    </button>

                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                        className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-40"
                    >
                        <Send size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}