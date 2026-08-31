import { Phone, PhoneIncoming, PhoneOutgoing, Video, PhoneMissed } from 'lucide-react';

export default function CallsView() {
  const callLogs = [
    { id: '1', name: 'Sarah Connor', type: 'incoming', date: 'Today, 2:15 PM', status: 'completed', isVideo: false },
    { id: '2', name: 'Design Guild', type: 'outgoing', date: 'Yesterday, 10:45 AM', status: 'completed', isVideo: true },
    { id: '3', name: 'Michael Scott', type: 'missed', date: '28 Aug, 4:20 PM', status: 'missed', isVideo: false },
  ];

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Recent Calls</h2>
        <p className="text-xs text-slate-400 mt-0.5">Review recent voice and video call logs</p>
      </div>

      <div className="divide-y divide-slate-50">
        {callLogs.map((call) => (
          <div key={call.id} className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  call.status === 'missed' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {call.status === 'missed' ? (
                  <PhoneMissed size={18} />
                ) : call.type === 'incoming' ? (
                  <PhoneIncoming size={18} />
                ) : (
                  <PhoneOutgoing size={18} />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">{call.name}</h4>
                <p className="text-xs text-slate-400">{call.date}</p>
              </div>
            </div>

            <button className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-600 transition">
              {call.isVideo ? <Video size={16} /> : <Phone size={16} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}