import { MessageSquare, Users, Phone, Contact, Bookmark, Settings, SquarePen, Search } from 'lucide-react';

export default function SidebarNav({ currentUser }) {
    return (
        <div className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 shrink-0 select-none">
            <div>
                {/* App Title */}
                <div className="flex items-center justify-between px-2 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                            <MessageSquare size={18} />
                        </div>
                        <span className="font-bold text-xl text-slate-800 tracking-tight">Chattr.</span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 transition">
                        <SquarePen size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <span className="absolute right-2.5 top-2.5 text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</span>
                </div>

                {/* Links */}
                <nav className="space-y-1">
                    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50/70 text-indigo-600 font-medium text-sm">
                        <div className="flex items-center gap-3">
                            <MessageSquare size={18} />
                            <span>Chats</span>
                        </div>
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">8</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-medium transition">
                        <Users size={18} />
                        <span>Groups</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-medium transition">
                        <Phone size={18} />
                        <span>Calls</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-medium transition">
                        <Contact size={18} />
                        <span>Contacts</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-medium transition">
                        <Bookmark size={18} />
                        <span>Saved Messages</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-medium transition">
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </nav>
            </div>

            {/* User Status Bar */}
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="relative">
                    <img
                        src={currentUser.avatar}
                        className="w-10 h-10 rounded-full object-cover"
                        alt={currentUser.name}
                    />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${currentUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                </div>
                <div className="flex flex-col flex-1 leading-tight min-w-0">
                    <span className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</span>
                    <span className="text-xs text-emerald-600 font-medium">Online</span>
                </div>
            </div>
        </div>
    );
}