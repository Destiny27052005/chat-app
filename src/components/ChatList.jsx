import { Users, SlidersHorizontal } from 'lucide-react';

export default function ChatList({ rooms, activeRoom, onSelectRoom }) {
    return (
        <div className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <button className="flex items-center gap-1.5 font-bold text-slate-800 text-base">
                    All Chats <span className="text-slate-400 text-xs">▼</span>
                </button>
                <button className="text-slate-400 hover:text-slate-600 transition">
                    <SlidersHorizontal size={18} />
                </button>
            </div>

            {/* Rooms Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {rooms.map((room) => {
                    const isSelected = activeRoom?._id === room._id;
                    return (
                        <div
                            key={room._id}
                            onClick={() => onSelectRoom(room)}
                            className={`flex items-center gap-3 p-4 cursor-pointer transition ${isSelected
                                    ? 'bg-indigo-50/50 border-l-4 border-indigo-600'
                                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                                }`}
                        >
                            {room.avatar ? (
                                <img src={room.avatar} alt={room.name} className="w-11 h-11 rounded-full object-cover" />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                    <Users size={20} />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="text-sm font-semibold text-slate-800 truncate">{room.name}</h4>
                                    <span className="text-[11px] text-slate-400">{room.time || '10:24 AM'}</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                    {room.lastMessage?.content || 'No messages yet'}
                                </p>
                            </div>

                            {room.unreadCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                                    {room.unreadCount}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}