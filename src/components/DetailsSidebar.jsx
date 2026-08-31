import { useState, useEffect } from 'react';
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
    Loader2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DetailsSidebar({ activeRoom, currentUser, onRoomUpdated }) {
    const [isMuted, setIsMuted] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [availableContacts, setAvailableContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [addingMemberId, setAddingMemberId] = useState(null);

    const isGroup = Boolean(activeRoom?.isGroup);
    const memberList = activeRoom?.members || [];

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // 1. Fetch users not currently in the group
    useEffect(() => {
        if (!showAddMember || !isGroup || !activeRoom?._id) return;

        let isMounted = true;

        const fetchContacts = async () => {
            try {
                setLoadingContacts(true);
                const res = await axios.get(`${API_BASE_URL}/auth/users`, {
                    headers: getAuthHeaders(),
                });
                if (isMounted) {
                    const currentMemberIds = new Set(
                        (activeRoom?.members || []).map((m) => m._id || m)
                    );
                    setAvailableContacts(res.data.filter((u) => !currentMemberIds.has(u._id)));
                }
            } catch (err) {
                console.error('Failed to fetch available contacts:', err);
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
    }, [showAddMember, isGroup, activeRoom?._id, activeRoom?.members]);

    // 2. Early return safe after all hooks are initialized
    if (!activeRoom) return null;

    // Identify contact for direct 1-to-1 conversation
    const otherMember = !isGroup
        ? memberList.find((m) => (m._id || m) !== currentUser?._id)
        : null;

    const roomName = isGroup
        ? activeRoom.name || 'Group Conversation'
        : otherMember?.name || activeRoom.name || 'Direct Conversation';

    const roomAvatar = isGroup
        ? activeRoom.avatar
        : otherMember?.avatar || activeRoom.avatar;

    const isOnline = isGroup ? false : Boolean(otherMember?.isOnline);

    // Handle adding a new participant to the group
    const handleAddMember = async (userId) => {
        try {
            setAddingMemberId(userId);

            const res = await axios.put(
                `${API_BASE_URL}/chat/rooms/${activeRoom._id}/members`,
                { userId },
                { headers: getAuthHeaders() }
            );

            // Update parent state with the populated room object from backend
            if (onRoomUpdated) {
                onRoomUpdated(res.data);
            }

            // Immediately remove from the available contacts popup list
            setAvailableContacts((prev) => prev.filter((u) => u._id !== userId));
        } catch (err) {
            console.error('Failed to add member:', err.response?.data || err.message);
            alert(err.response?.data?.error || 'Could not add member to this group.');
        } finally {
            setAddingMemberId(null);
        }
    };

    return (
        <div className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col justify-between overflow-y-auto shrink-0 select-none h-full relative">
            <div>
                {/* Room / Contact Header */}
                <div className="flex flex-col items-center text-center mb-6">
                    {roomAvatar ? (
                        <img
                            src={roomAvatar}
                            alt={roomName}
                            className="w-16 h-16 rounded-2xl object-cover mb-3 shadow-md shadow-slate-100 border border-slate-100"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-indigo-100">
                            {isGroup ? <Users size={30} /> : <span className="text-xl">{roomName.charAt(0)}</span>}
                        </div>
                    )}

                    <h3 className="font-bold text-slate-800 text-base leading-snug truncate max-w-full px-2">
                        {roomName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {isGroup
                            ? `${memberList.length} members`
                            : isOnline
                                ? 'Active now'
                                : 'Offline'}
                    </p>
                </div>

                {/* Quick Action Buttons */}
                <div className={`grid ${isGroup ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-6`}>
                    {isGroup && (
                        <button
                            type="button"
                            onClick={() => setShowAddMember(true)}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                        >
                            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center">
                                <UserPlus size={16} />
                            </div>
                            <span className="text-[11px] font-medium">Add</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                    >
                        <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center">
                            <Search size={16} />
                        </div>
                        <span className="text-[11px] font-medium">Search</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsMuted((prev) => !prev)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition ${isMuted ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center">
                            {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
                        </div>
                        <span className="text-[11px] font-medium">{isMuted ? 'Muted' : 'Mute'}</span>
                    </button>

                    <button
                        type="button"
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                    >
                        <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center">
                            <MoreVertical size={16} />
                        </div>
                        <span className="text-[11px] font-medium">More</span>
                    </button>
                </div>

                {/* Description / Bio */}
                <div className="mb-6">
                    <h5 className="text-xs font-bold text-slate-800 mb-1.5">
                        {isGroup ? 'Description' : 'About'}
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {activeRoom.description ||
                            (isGroup
                                ? 'Welcome to the group chat! Share updates, files, and discussion points.'
                                : 'Hey there! I am using Chattr.')}
                    </p>
                </div>

                {/* Accordion Links */}
                <div className="space-y-1 mb-6 border-t border-b border-slate-100 py-3">
                    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer transition">
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            <span>Media, Links, and Docs</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <span>{activeRoom.mediaCount ?? 0}</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer transition">
                        <div className="flex items-center gap-2">
                            <Pin size={16} className="text-slate-400" />
                            <span>Pinned Messages</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <span>{activeRoom.pinnedCount ?? 0}</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer transition">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-slate-400" />
                            <span>Notifications</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <span>{isMuted ? 'Muted' : 'On'}</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>

                {/* Members Section (For Group Chats) */}
                {isGroup && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="text-xs font-bold text-slate-800">Members</h5>
                            <span className="text-xs text-slate-400">{memberList.length}</span>
                        </div>

                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            {memberList.map((member) => {
                                const memberId = member._id || member;
                                const isAdmin = activeRoom.admins?.some(
                                    (admin) => (admin._id || admin) === memberId
                                );

                                return (
                                    <div key={memberId} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative shrink-0">
                                                <img
                                                    src={
                                                        member.avatar ||
                                                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name || 'User')}`
                                                    }
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    alt={member.name || 'Member'}
                                                />
                                                <span
                                                    className={`absolute bottom-0 right-0 w-2 h-2 border border-white rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                                                        }`}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 truncate">
                                                    {member.name || 'Member'}
                                                </p>
                                                <p className={`text-[10px] ${member.isOnline ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                                                    {member.isOnline ? 'Online' : 'Offline'}
                                                </p>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold shrink-0">
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

            {/* Add Member Modal Overlay */}
            {showAddMember && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-800">Add Member to Group</h4>
                            <button
                                type="button"
                                onClick={() => setShowAddMember(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {loadingContacts ? (
                                <div className="py-6 flex items-center justify-center text-xs text-slate-400 gap-1.5">
                                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                                    <span>Loading contacts...</span>
                                </div>
                            ) : availableContacts.length === 0 ? (
                                <div className="py-6 text-center text-xs text-slate-400">
                                    No new contacts available to add
                                </div>
                            ) : (
                                availableContacts.map((contact) => (
                                    <div
                                        key={contact._id}
                                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <img
                                                src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}`}
                                                alt={contact.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 truncate">{contact.name}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{contact.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddMember(contact._id)}
                                            disabled={addingMemberId === contact._id}
                                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                        >
                                            {addingMemberId === contact._id ? (
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
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}