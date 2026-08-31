import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Phone,
  Contact,
  Bookmark,
  Settings,
  SquarePen,
  Search
} from 'lucide-react';

export default function SidebarNav({ currentUser, onNewChat, onSearchChange, unreadTotal = 8 }) {
  const [activeTab, setActiveTab] = useState('chats');
  const searchInputRef = useRef(null);

  // Global ⌘K / Ctrl+K shortcut listener to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadTotal },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'contacts', label: 'Contacts', icon: Contact },
    { id: 'saved', label: 'Saved Messages', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userName = currentUser?.name || 'User Profile';
  const userAvatar =
    currentUser?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`;

  return (
    <div className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 shrink-0 select-none h-full">
      <div>
        {/* App Title & New Chat Action */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-100">
              <MessageSquare size={18} />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">Chattr.</span>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            title="New Chat"
            className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-indigo-50/50 transition"
          >
            <SquarePen size={18} />
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search chats..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-700 transition placeholder:text-slate-400"
          />
          <kbd className="absolute right-2.5 top-2.5 text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition ${
                  isActive
                    ? 'bg-indigo-50/70 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Current User Status Bar */}
      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
        <div className="relative shrink-0">
          <img
            src={userAvatar}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
            alt={userName}
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
              currentUser?.isOnline !== false ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </div>
        <div className="flex flex-col flex-1 leading-tight min-w-0">
          <span className="text-sm font-semibold text-slate-800 truncate">{userName}</span>
          <span
            className={`text-xs font-medium ${
              currentUser?.isOnline !== false ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {currentUser?.isOnline !== false ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}