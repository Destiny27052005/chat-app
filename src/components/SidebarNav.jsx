import {
  MessageSquare,
  Users,
  UserCheck,
  Phone,
  Bookmark,
  Settings,
  LogOut
} from 'lucide-react';

export default function SidebarNav({
  currentUser,
  activeTab,
  onTabChange,
  onLogout
}) {
  const navItems = [
    { id: 'chats', label: 'All Chats', icon: MessageSquare },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'contacts', label: 'Contacts', icon: UserCheck },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userAvatar =
    currentUser?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      currentUser?.name || 'User'
    )}`;

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 shrink-0 h-full select-none">
      {/* Brand & Nav List */}
      <div>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 font-bold text-lg">
            C
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Chattr</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-50/80 border border-slate-100/80 rounded-2xl p-2.5 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with Green Online Indicator */}
          <div className="relative shrink-0">
            <img
              src={userAvatar}
              alt={currentUser?.name || 'User'}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-500/20 animate-pulse" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate" title={currentUser?.name}>
              {currentUser?.name || 'Guest User'}
            </h4>
            <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
              <span>Online</span>
            </p>
          </div>
        </div>

        {/* Logout Action */}
        <button
          type="button"
          onClick={onLogout}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}