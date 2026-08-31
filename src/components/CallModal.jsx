import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function CallModal({ callData, currentUser, socket, onClose }) {
  const [callAccepted, setCallAccepted] = useState(!callData.isIncoming);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callData.type === 'voice');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callDurationRef = useRef(0);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socket) {
      socket.off('call_accepted');
      socket.off('ice_candidate');
      socket.off('call_ended');
    }
  }, [socket]);

  const saveCallLog = useCallback(async () => {
    const receiverId = callData.otherUser?._id;
    if (receiverId && currentUser?._id) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE_URL}/calls`,
          {
            receiver: receiverId,
            room: callData.roomId?.length === 24 ? callData.roomId : null,
            type: callData.type || 'voice',
            status: callDurationRef.current > 0 ? 'completed' : 'missed',
            duration: callDurationRef.current,
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      } catch (err) {
        console.error('Failed to save call log:', err);
      }
    }
  }, [callData.otherUser?._id, callData.roomId, callData.type, currentUser?._id]);

  const handleEndCall = useCallback(async () => {
    socket?.emit('end_call', { roomId: callData.roomId, to: callData.otherUser?._id });
    await saveCallLog();
    cleanup();
    onClose();
  }, [socket, callData.roomId, callData.otherUser?._id, saveCallLog, cleanup, onClose]);

  // Duration timer
  useEffect(() => {
    let timer;
    if (callAccepted) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callAccepted]);

  // Setup Peer Connection when call is active/accepted
  const setupWebRTC = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callData.type === 'video',
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local media tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Receive remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Send local ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            roomId: callData.roomId,
            to: callData.otherUser?._id,
            candidate: event.candidate,
          });
        }
      };

      if (!callData.isIncoming) {
        // Caller creates Offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callData.type === 'video',
        });
        await pc.setLocalDescription(offer);

        socket?.emit('call_user', {
          roomId: callData.roomId,
          userToCall: callData.otherUser?._id,
          signalData: offer,
          callerName: currentUser?.name,
          type: callData.type,
        });
      } else if (callData.signal) {
        // Receiver sets Remote Offer & creates Answer
        await pc.setRemoteDescription(new RTCSessionDescription(callData.signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket?.emit('answer_call', {
          toRoom: callData.roomId,
          to: callData.otherUser?._id,
          signal: answer,
        });
      }

      socket?.on('call_accepted', async (signal) => {
        setCallAccepted(true);
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        }
      });

      socket?.on('ice_candidate', async (candidate) => {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          console.error('ICE candidate error:', e);
        }
      });

      socket?.on('call_ended', async () => {
        await saveCallLog();
        cleanup();
        onClose();
      });
    } catch (err) {
      console.error('Media Device / WebRTC Error:', err);
      alert('Camera or Microphone access was denied or not found.');
      onClose();
    }
  }, [callData, currentUser, socket, cleanup, onClose, saveCallLog]);

  useEffect(() => {
    if (!callData.isIncoming) {
      setupWebRTC();
    }
    return () => {
      cleanup();
    };
  }, [callData.isIncoming, setupWebRTC, cleanup]);

  const handleAcceptIncomingCall = () => {
    setCallAccepted(true);
    setupWebRTC();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Active Connected Screen */}
        {callAccepted ? (
          <>
            {callData.type === 'video' ? (
              <div className="w-full h-72 bg-slate-950 rounded-2xl overflow-hidden relative mb-4 border border-slate-800 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 w-28 h-20 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-md">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center my-6">
                <audio ref={remoteVideoRef} autoPlay />
                <div className="relative mb-3">
                  {callData.otherUser?.avatar ? (
                    <img
                      src={callData.otherUser.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold">
                      {callData.otherUser?.name?.charAt(0) || <Users size={32} />}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                </div>
              </div>
            )}

            <h3 className="text-base font-bold text-slate-100 mb-0.5">
              {callData.otherUser?.name || 'Active Call'}
            </h3>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
              {callData.type === 'video' ? 'Real-time Video Stream' : 'Live Encrypted Voice Call'}
            </p>
            <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1 rounded-full mb-6">
              {formatTimer(callDuration)}
            </span>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3.5 rounded-full transition ${
                  isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition transform hover:scale-105"
                title="End Call"
              >
                <PhoneOff size={22} />
              </button>

              {callData.type === 'video' && (
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-full transition ${
                    isVideoOff ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
                >
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}
            </div>
          </>
        ) : (
          /* Incoming Call Ringing Screen */
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-indigo-600/30 animate-ping absolute inset-0" />
              {callData.otherUser?.avatar ? (
                <img
                  src={callData.otherUser.avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover relative z-10 border-4 border-slate-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold relative z-10">
                  {callData.otherUser?.name?.charAt(0) || <Users size={32} />}
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{callData.otherUser?.name}</h3>
            <p className="text-xs text-indigo-400 font-medium mb-8">
              Incoming {callData.type === 'video' ? 'Video' : 'Voice'} Call...
            </p>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleAcceptIncomingCall}
                className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition transform hover:scale-110 flex items-center justify-center"
                title="Accept"
              >
                <Phone size={24} />
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition transform hover:scale-110 flex items-center justify-center"
                title="Decline"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}