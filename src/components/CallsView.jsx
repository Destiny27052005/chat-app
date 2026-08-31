import { useState, useEffect } from 'react';
import axios from 'axios';
import CallModal from './CallModal.jsx';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Video,
  PhoneMissed,
  Loader2,
  Users
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CallsView({ currentUser, socket }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'missed'
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCallSession, setActiveCallSession] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch real call records directly inside effect
  useEffect(() => {
    let isMounted = true;

    const loadCallLogs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/calls`, {
          headers: getAuthHeaders(),
        });
        if (isMounted) {
          setCallLogs(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load call logs:', err);
          setCallLogs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCallLogs();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  // 2. Listen for incoming live socket calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setActiveCallSession({
        isIncoming: true,
        type: data.type,
        roomId: data.roomId || data.from,
        signal: data.signal,
        otherUser: { _id: data.from, name: data.callerName, avatar: data.avatar },
      });
    };

    socket.on('incoming_call', handleIncomingCall);
    return () => socket.off('incoming_call', handleIncomingCall);
  }, [socket]);

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatCallDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
  };

  const handleStartCall = (contact, isVideo) => {
    const callType = isVideo ? 'video' : 'voice';
    setActiveCallSession({
      isIncoming: false,
      type: callType,
      roomId: contact._id,
      otherUser: contact,
    });
  };

  const handleCloseCall = () => {
    setActiveCallSession(null);
    setRefreshIndex((prev) => prev + 1); // Triggers real log reload cleanly
  };

  const filteredLogs = callLogs.filter((call) => {
    if (filter === 'missed') return call.status === 'missed';
    return true;
  });

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Call History</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time voice and video records</p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
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
            type="button"
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
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
            Loading call records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            {filter === 'missed' ? 'No missed calls found' : 'No call history yet. Start a call from the contacts list.'}
          </div>
        ) : (
          filteredLogs.map((call) => {
            const isOutgoing = (call.caller?._id || call.caller) === currentUser?._id;
            const otherParty = isOutgoing ? call.receiver : call.caller;
            const isMissed = call.status === 'missed';

            return (
              <div
                key={call._id}
                className="py-3.5 px-2 flex items-center justify-between hover:bg-slate-50/70 rounded-2xl transition"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isMissed
                        ? 'bg-rose-50 text-rose-500'
                        : isOutgoing
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {isMissed ? (
                      <PhoneMissed size={18} />
                    ) : isOutgoing ? (
                      <PhoneOutgoing size={18} />
                    ) : (
                      <PhoneIncoming size={18} />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {otherParty?.avatar ? (
                      <img
                        src={otherParty.avatar}
                        alt={otherParty.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                        {otherParty?.name?.charAt(0) || <Users size={16} />}
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {otherParty?.name || 'Unknown User'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatCallDate(call.createdAt)}</span>
                        <span>•</span>
                        <span className={isMissed ? 'text-rose-500 font-medium' : ''}>
                          {isMissed ? 'Missed Call' : formatDuration(call.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {otherParty && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartCall(otherParty, false)}
                      className="p-2.5 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition"
                      title="Audio Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartCall(otherParty, true)}
                      className="p-2.5 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition"
                      title="Video Call"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {activeCallSession && (
        <CallModal
          callData={activeCallSession}
          currentUser={currentUser}
          socket={socket}
          onClose={handleCloseCall}
        />
      )}
    </div>
  );
}