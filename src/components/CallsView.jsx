import { useState, useEffect } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Video,
  VideoOff,
  PhoneMissed,
  PhoneOff,
  Mic,
  MicOff
} from 'lucide-react';

export default function CallsView() {
  const [filter, setFilter] = useState('all'); // 'all' | 'missed'
  const [activeCall, setActiveCall] = useState(null); // { name, isVideo, status: 'calling'|'connected' }
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [callLogs, setCallLogs] = useState([
    {
      id: '1',
      name: 'Sarah Connor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      type: 'incoming',
      date: 'Today, 2:15 PM',
      duration: '12m 45s',
      status: 'completed',
      isVideo: false,
    },
    {
      id: '2',
      name: 'Design Guild & UI Team',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      type: 'outgoing',
      date: 'Yesterday, 10:45 AM',
      duration: '45m 10s',
      status: 'completed',
      isVideo: true,
    },
    {
      id: '3',
      name: 'Michael Scott',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      type: 'incoming',
      date: '28 Aug, 4:20 PM',
      duration: 'Missed',
      status: 'missed',
      isVideo: false,
    },
  ]);

  // Call timer simulation
  useEffect(() => {
    let timer;
    if (activeCall?.status === 'connected') {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = (contactName, isVideo) => {
    setActiveCall({
      name: contactName,
      isVideo,
      status: 'calling',
    });
    setCallDuration(0);

    // Simulate connection after 2 seconds
    setTimeout(() => {
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }, 2000);
  };

  const handleEndCall = () => {
    if (activeCall) {
      // Append completed call to logs
      setCallLogs((prev) => [
        {
          id: Date.now().toString(),
          name: activeCall.name,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${activeCall.name}`,
          type: 'outgoing',
          date: 'Just now',
          duration: callDuration > 0 ? formatTimer(callDuration) : 'Cancelled',
          status: 'completed',
          isVideo: activeCall.isVideo,
        },
        ...prev,
      ]);
    }
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const filteredLogs = callLogs.filter((call) =>
    filter === 'missed' ? call.status === 'missed' : true
  );

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Call History</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage audio and video conferences</p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Calls
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'missed'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">No call records found</div>
        ) : (
          filteredLogs.map((call) => (
            <div
              key={call.id}
              className="py-3.5 px-2 flex items-center justify-between hover:bg-slate-50/70 rounded-2xl transition"
            >
              <div className="flex items-center gap-3.5">
                {/* Direction Status Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    call.status === 'missed'
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-emerald-50 text-emerald-600'
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

                <div className="flex items-center gap-3">
                  <img
                    src={call.avatar}
                    alt={call.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{call.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{call.date}</span>
                      <span>•</span>
                      <span className={call.status === 'missed' ? 'text-rose-500 font-medium' : ''}>
                        {call.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCall(call.name, false)}
                  className="p-2.5 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition"
                  title="Voice Call"
                >
                  <Phone size={16} />
                </button>
                <button
                  onClick={() => handleStartCall(call.name, true)}
                  className="p-2.5 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition"
                  title="Video Call"
                >
                  <Video size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active Calling Modal Overlay */}
      {activeCall && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl text-white animate-in zoom-in-95 duration-200">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 p-1 animate-pulse">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${activeCall.name}`}
                  alt={activeCall.name}
                  className="w-full h-full rounded-full object-cover bg-slate-800"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold">{activeCall.name}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeCall.status === 'calling'
                ? `Ringing ${activeCall.isVideo ? 'Video' : 'Audio'}...`
                : formatTimer(callDuration)}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className={`p-3.5 rounded-full transition ${
                  isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {activeCall.isVideo && (
                <button
                  onClick={() => setIsVideoOff((prev) => !prev)}
                  className={`p-3.5 rounded-full transition ${
                    isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                >
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              <button
                onClick={handleEndCall}
                className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/50 transition"
                title="End Call"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}