import { Users, UserPlus, Search, Bell, MoreVertical, FileText, Pin, ChevronRight } from 'lucide-react';

export default function DetailsSidebar({ activeRoom }) {
    if (!activeRoom) return null;

    return (
        <div className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col justify-between overflow-y-auto shrink-0 select-none">
            <div>
                {/* Room Avatar & Name */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-indigo-100">
                        <Users size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">{activeRoom.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeRoom.members?.length || 0} members</p>
                </div>

                {/* Quick Action Matrix */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition">
                        <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center"><UserPlus size={16} /></div>
                        <span className="text-[11px]">Add</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition">
                        <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center"><Search size={16} /></div>
                        <span className="text-[11px]">Search</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition">
                        <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center"><Bell size={16} /></div>
                        <span className="text-[11px]">Mute</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition">
                        <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center"><MoreVertical size={16} /></div>
                        <span className="text-[11px]">More</span>
                    </button>
                </div>

                {/* Description Section */}
                <div className="mb-6">
                    <h5 className="text-xs font-bold text-slate-800 mb-1.5">Description</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {activeRoom.description || 'This group is for all things design related. Share ideas, feedback, and inspiration!'}
                    </p>
                </div>

                {/* Accordion Links */}
                <div className="space-y-1 mb-6 border-t border-b border-slate-50 py-3">
                    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer transition">
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            <span>Media, Links, and Docs</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <span>128</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer transition">
                        <div className="flex items-center gap-2">
                            <Pin size={16} className="text-slate-400" />
                            <span>Pinned Messages</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <span>3</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer transition">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-slate-400" />
                            <span>Notifications</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <span>On</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>

                {/* Member Status Listing */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-slate-800">Members</h5>
                        <span className="text-xs text-slate-400">{activeRoom.members?.length || 0} &gt;</span>
                    </div>

                    <div className="space-y-3">
                        {activeRoom.members?.map((member) => (
                            <div key={member._id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="relative">
                                        <img
                                            src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop'}
                                            className="w-8 h-8 rounded-full object-cover"
                                            alt={member.name}
                                        />
                                        <span className={`absolute bottom-0 right-0 w-2 h-2 border border-white rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                                        <p className="text-[10px] text-emerald-600">{member.isOnline ? 'Online' : 'Offline'}</p>
                                    </div>
                                </div>
                                {activeRoom.admins?.some(a => (a._id || a) === member._id) && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">Admin</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-2 transition">
                View all members &gt;
            </button>
        </div>
    );
}