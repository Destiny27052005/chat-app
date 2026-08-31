import { Users, SlidersHorizontal, Image as ImageIcon, FileText } from 'lucide-react';

export default function ChatList({ rooms = [], activeRoom, onSelectRoom, isLoading = false }) {
  const formatTime = (dateValue) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string' && (dateValue.includes('AM') || dateValue.includes('PM'))) {
      return dateValue;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMessagePreview = (room) => {
    const lastMsg = room.lastMessage;
    if (!lastMsg) return 'No messages yet';

    // If lastMessage is a direct string
    if (typeof lastMsg === 'string') return lastMsg;

    // If message contains text content
    if (lastMsg.content || lastMsg.text) {
      return lastMsg.content || lastMsg.text;
    }

    // If message is a file attachment
    if (lastMsg.file) {
      return (
        <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
          {lastMsg.file.fileType?.includes('image') ? (
            <ImageIcon size={12} />
          ) : (
            <FileText size={12} />
          )}
          {lastMsg.file.name || 'Attachment'}
        </span>
      );
    }

    return 'No messages yet';
  };

  return (
    <div className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
        <button className="flex items-center gap-1.5 font-bold text-slate-800 text-sm hover:text-slate-900 transition">
          All Chats <span className="text-slate-400 text-xs">▼</span>
        </button>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
          title="Filter chats"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Rooms Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No active conversations</div>
        ) : (
          rooms.map((room) => {
            const isSelected = activeRoom?._id === room._id;
            const messageTime =
              room.time ||
              formatTime(room.lastMessage?.createdAt || room.updatedAt);

            return (
              <div
                key={room._id}
                onClick={() => onSelectRoom(room)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition ${
                  isSelected
                    ? 'bg-indigo-50/50 border-l-4 border-indigo-600'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                {/* Avatar with Online Presence */}
                <div className="relative shrink-0">
                  {room.avatar ? (
                    <img
                      src={room.avatar}
                      alt={room.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      <Users size={20} />
                    </div>
                  )}

                  {room.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">
                      {room.name || 'Conversation'}
                    </h4>
                    {messageTime && (
                      <span className="text-[11px] text-slate-400 shrink-0 ml-1">
                        {messageTime}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 truncate">
                    {getLastMessagePreview(room)}
                  </p>
                </div>

                {/* Unread Counter */}
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
    </div>
  );
}