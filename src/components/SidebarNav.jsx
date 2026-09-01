// src/components/SidebarNav.jsx
import { MessageSquare, Users, Phone, Bookmark, Settings, LogOut, UserCheck } from 'lucide-react';

export default function SidebarNav({ currentUser, activeTab, onTabChange, onLogout }) {
  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'contacts', label: 'Contacts', icon: UserCheck },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 justify-between select-none transition-colors">
      {/* Brand Icon */}
      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
        C
      </div>

      {/* Navigation Buttons */}
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`p-3 rounded-2xl transition duration-200 relative cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title={item.label}
            >
              <Icon size={22} />
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={onLogout}
          className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition cursor-pointer"
          title="Logout"
        >
          <LogOut size={20} />
        </button>

        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            currentUser?.name?.charAt(0) || 'U'
          )}
        </div>
      </div>
    </aside>
  );
}