import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
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
  const iceCandidatesQueue = useRef([]);

  // Keep latest state / props inside useEffect updates
  const callDataRef = useRef(callData);
  const currentUserRef = useRef(currentUser);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    callDataRef.current = callData;
    currentUserRef.current = currentUser;
    onCloseRef.current = onClose;
    callDurationRef.current = callDuration;
  }, [callData, currentUser, onClose, callDuration]);

  // Duration timer
  useEffect(() => {
    let timer;
    if (callAccepted) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callAccepted]);

  const cleanup = () => {
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
  };

  const saveCallLog = async () => {
    const receiverId = callDataRef.current?.otherUser?._id;
    if (receiverId && currentUserRef.current?._id) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE_URL}/calls`,
          {
            receiver: receiverId,
            room: callDataRef.current?.roomId?.length === 24 ? callDataRef.current.roomId : null,
            type: callDataRef.current?.type || 'voice',
            status: callDurationRef.current > 0 ? 'completed' : 'missed',
            duration: callDurationRef.current,
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      } catch (err) {
        console.error('Failed to save call log:', err);
      }
    }
  };

  const handleEndCall = async () => {
    socket?.emit('end_call', {
      roomId: callDataRef.current?.roomId,
      to: callDataRef.current?.otherUser?._id,
    });
    await saveCallLog();
    cleanup();
    onCloseRef.current?.();
  };

  // WebRTC Setup Function
  const setupWebRTC = async (isAnswering = false) => {
    try {
      const currentCallData = callDataRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video:
          currentCallData.type === 'video'
            ? {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 24, max: 30 },
            }
            : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote incoming track
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Emit local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            roomId: callDataRef.current?.roomId,
            to: callDataRef.current?.otherUser?._id,
            candidate: event.candidate,
          });
        }
      };

      // Remote ICE Candidate Listener
      socket?.on('ice_candidate', async (candidate) => {
        if (!candidate) return;
        try {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            iceCandidatesQueue.current.push(candidate);
          }
        } catch (e) {
          console.error('ICE candidate processing error:', e);
        }
      });

      // Remote Call Accepted
      socket?.on('call_accepted', async (signal) => {
        setCallAccepted(true);
        if (pc.signalingState !== 'stable') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            while (iceCandidatesQueue.current.length > 0) {
              const queuedCandidate = iceCandidatesQueue.current.shift();
              await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
            }
          } catch (e) {
            console.error('Remote description error on accept:', e);
          }
        }
      });

      // Call Ended by Remote
      socket?.on('call_ended', async () => {
        await saveCallLog();
        cleanup();
        onCloseRef.current?.();
      });

      // Offer / Answer Negotiation
      if (!currentCallData.isIncoming) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: currentCallData.type === 'video',
        });
        await pc.setLocalDescription(offer);

        socket?.emit('call_user', {
          roomId: currentCallData.roomId,
          userToCall: currentCallData.otherUser?._id,
          signalData: offer,
          callerName: currentUserRef.current?.name,
          type: currentCallData.type,
        });
      } else if (isAnswering && currentCallData.signal) {
        await pc.setRemoteDescription(new RTCSessionDescription(currentCallData.signal));

        while (iceCandidatesQueue.current.length > 0) {
          const queuedCandidate = iceCandidatesQueue.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket?.emit('answer_call', {
          toRoom: currentCallData.roomId,
          to: currentCallData.otherUser?._id,
          signal: answer,
        });
      }
    } catch (err) {
      console.error('Media Device / WebRTC Setup Error:', err);
      alert('Camera or Microphone access was denied or not found.');
      cleanup();
      onCloseRef.current?.();
    }
  };

  // Mount/Unmount lifecycle
  useEffect(() => {
    if (!callData.isIncoming) {
      setupWebRTC(false);
    }
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptIncomingCall = () => {
    setCallAccepted(true);
    setupWebRTC(true);
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
                className={`p-3.5 rounded-full transition cursor-pointer ${isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition transform hover:scale-105 cursor-pointer"
                title="End Call"
              >
                <PhoneOff size={22} />
              </button>

              {callData.type === 'video' && (
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-full transition cursor-pointer ${isVideoOff ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
                >
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}
            </div>
          </>
        ) : (
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
                className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition transform hover:scale-110 flex items-center justify-center cursor-pointer"
                title="Accept"
              >
                <Phone size={24} />
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition transform hover:scale-110 flex items-center justify-center cursor-pointer"
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