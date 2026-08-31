import { LogOut, Bell, Shield, Moon } from 'lucide-react';

export default function SettingsView({ currentUser, onLogout }) {
    return (
        <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto max-w-3xl">
            <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Settings & Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage your profile, preferences, and authentication</p>
            </div>

            {/* User Info Header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <img
                    src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name}`}
                    alt={currentUser?.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                    <h3 className="font-bold text-slate-800 text-base">{currentUser?.name}</h3>
                    <p className="text-xs text-slate-500">{currentUser?.email}</p>
                </div>
            </div>

            <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                        <Bell size={18} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Notifications</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">Enabled</span>
                </div>

                <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                        <Shield size={18} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Privacy & Security</span>
                    </div>
                    <span className="text-xs text-slate-400">JWT Verified</span>
                </div>

                <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                        <Moon size={18} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Dark Mode</span>
                    </div>
                    <span className="text-xs text-slate-400">System Default</span>
                </div>
            </div>

            {/* Logout Action */}
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm rounded-xl transition border border-rose-100"
            >
                <LogOut size={16} />
                <span>Log Out of Chattr</span>
            </button>
        </div>
    );
}