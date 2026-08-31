import  { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Bell,
  BellOff,
  MoreVertical,
  FileText,
  Pin,
  ChevronRight
} from 'lucide-react';

export default function DetailsSidebar({ activeRoom }) {
  const [isMuted, setIsMuted] = useState(false);

  if (!activeRoom) return null;

  const isGroup = activeRoom.isGroup ?? (activeRoom.members?.length > 2);
  const memberList = activeRoom.members || [];
  const roomName = activeRoom.name || 'Conversation Details';

  return (
    <div className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col justify-between overflow-y-auto shrink-0 select-none h-full">
      <div>
        {/* Room / Contact Header */}
        <div className="flex flex-col items-center text-center mb-6">
          {activeRoom.avatar ? (
            <img
              src={activeRoom.avatar}
              alt={roomName}
              className="w-16 h-16 rounded-2xl object-cover mb-3 shadow-md shadow-slate-100 border border-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-indigo-100">
              {isGroup ? <Users size={30} /> : <span className="text-xl">{roomName.charAt(0)}</span>}
            </div>
          )}

          <h3 className="font-bold text-slate-800 text-base leading-snug">{roomName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isGroup
              ? `${memberList.length} members`
              : activeRoom.isOnline
              ? 'Active now'
              : 'Offline'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {isGroup && (
            <button
              type="button"
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
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition ${
              isMuted ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:bg-slate-50'
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

        {/* Members Section (If Group) */}
        {isGroup && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold text-slate-800">Members</h5>
              <span className="text-xs text-slate-400">{memberList.length}</span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {memberList.map((member) => {
                const isAdmin = activeRoom.admins?.some(
                  (admin) => (admin._id || admin) === member._id
                );

                return (
                  <div key={member._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            member.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${member.name || 'User'}`
                          }
                          className="w-8 h-8 rounded-full object-cover"
                          alt={member.name}
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 border border-white rounded-full ${
                            member.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {member.name}
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

      {isGroup && memberList.length > 5 && (
        <button
          type="button"
          className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-2 transition mt-4"
        >
          View all members &gt;
        </button>
      )}
    </div>
  );
}