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

  // 1. Fetch real call records
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
    setRefreshIndex((prev) => prev + 1);
  };

  const filteredLogs = callLogs.filter((call) => {
    if (filter === 'missed') return call.status === 'missed';
    return true;
  });

  return (
    <div className="flex-1 bg-[#fafafc] dark:bg-slate-950 flex flex-col p-6 md:p-10 overflow-y-auto relative h-full max-w-5xl mx-auto w-full transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Call History</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time voice and video records</p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Calls
          </button>
          <button
            type="button"
            onClick={() => setFilter('missed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filter === 'missed'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
        {loading ? (
          <div className="flex items-center justify-center p-16 text-slate-400 dark:text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
            Loading call records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600 text-xs">
            {filter === 'missed'
              ? 'No missed calls found'
              : 'No call history yet. Start a call from the contacts list.'}
          </div>
        ) : (
          filteredLogs.map((call) => {
            const currentUserId = currentUser?._id?.toString();
            const isOutgoing = (call.caller?._id || call.caller)?.toString() === currentUserId;
            const otherParty = isOutgoing ? call.receiver : call.caller;
            const isMissed = call.status === 'missed';

            return (
              <div
                key={call._id}
                className="py-3.5 px-3 flex items-center justify-between hover:bg-white dark:hover:bg-slate-900/60 rounded-2xl transition border border-transparent hover:border-slate-100 dark:hover:border-slate-800 shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isMissed
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
                        : isOutgoing
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
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

                  <div className="flex items-center gap-3 min-w-0">
                    {otherParty?.avatar ? (
                      <img
                        src={otherParty.avatar}
                        alt={otherParty.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                        {otherParty?.name?.charAt(0) || <Users size={16} />}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {otherParty?.name || 'Unknown User'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <span>{formatCallDate(call.createdAt)}</span>
                        <span>•</span>
                        <span className={isMissed ? 'text-rose-500 dark:text-rose-400 font-medium' : ''}>
                          {isMissed ? 'Missed Call' : formatDuration(call.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {otherParty && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartCall(otherParty, false)}
                      className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition cursor-pointer"
                      title="Audio Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartCall(otherParty, true)}
                      className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition cursor-pointer"
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