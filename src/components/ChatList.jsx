import { useState } from 'react';
import { Users, Search, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';

export default function ChatList({
  rooms = [],
  activeRoom,
  onSelectRoom,
  currentUser,
  isLoading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'direct' | 'groups'

  // Format timestamps cleanly (Time / Yesterday / Date)
  const formatTime = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Preview snippet for text or attachments
  const getLastMessagePreview = (room) => {
    const lastMsg = room.lastMessage;
    if (!lastMsg) return 'No messages yet';

    if (typeof lastMsg === 'string') return lastMsg;

    if (lastMsg.content || lastMsg.text) {
      return lastMsg.content || lastMsg.text;
    }

    if (lastMsg.file) {
      return (
        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
          {lastMsg.file.fileType?.includes('image') ? (
            <ImageIcon size={13} />
          ) : (
            <FileText size={13} />
          )}
          <span className="truncate max-w-35">{lastMsg.file.name || 'Attachment'}</span>
        </span>
      );
    }

    return 'No messages yet';
  };

  // Resolve dynamic avatar/name/presence for direct 1-to-1 conversations
  const getRoomDisplayDetails = (room) => {
    const isGroup = Boolean(room.isGroup);

    if (isGroup) {
      return {
        name: room.name || 'Group Conversation',
        avatar: room.avatar || '',
        isOnline: false,
      };
    }

    const currentUserId = currentUser?._id?.toString();
    const otherMember = (room.members || []).find((m) => {
      const memberId = (m?._id || m)?.toString();
      return memberId && memberId !== currentUserId;
    });

    return {
      name: otherMember?.name || room.name || 'Direct Chat',
      avatar: otherMember?.avatar || room.avatar || '',
      isOnline: Boolean(otherMember?.isOnline),
    };
  };

  // Filter list by search query and room category
  const filteredRooms = rooms.filter((room) => {
    const details = getRoomDisplayDetails(room);
    const matchesSearch =
      details.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getLastMessagePreview(room)?.toString().toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'direct') return !room.isGroup;
    if (filterType === 'groups') return room.isGroup;
    return true;
  });

  return (
    <aside
      className={`w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full shrink-0 select-none transition-colors ${
        activeRoom ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Messages</h3>
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
            {rooms.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {['all', 'direct', 'groups'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 dark:text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading conversations...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            <p>{searchQuery ? 'No matching conversations' : 'No active chats found'}</p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isSelected = activeRoom?._id === room._id;
            const details = getRoomDisplayDetails(room);
            const messageTime = formatTime(room.lastMessage?.createdAt || room.updatedAt);

            return (
              <div
                key={room._id}
                onClick={() => onSelectRoom(room)}
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-slate-800 border-l-4 border-indigo-600'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {details.avatar ? (
                    <img
                      src={details.avatar}
                      alt={details.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {room.isGroup ? <Users size={18} /> : <span>{details.name.charAt(0)}</span>}
                    </div>
                  )}

                  {details.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>

                {/* Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {details.name}
                    </h4>
                    {messageTime && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-1 font-medium">
                        {messageTime}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-snug">
                    {getLastMessagePreview(room)}
                  </p>
                </div>

                {/* Unread Counter Badge */}
                {room.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}