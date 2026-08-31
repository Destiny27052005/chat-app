import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { socket, connectSocket, disconnectSocket } from './socket.js';
import SidebarNav from './components/SidebarNav.jsx';
import ChatList from './components/ChatList.jsx';
import ChatArea from './components/ChatArea.jsx';
import DetailsSidebar from './components/DetailsSidebar.jsx';
import GroupsView from './components/GroupsView.jsx';
import ContactsView from './components/ContactsView.jsx';
import CallsView from './components/CallsView.jsx';
import SavedMessagesView from './components/SavedMessagesView.jsx';
import SettingsView from './components/SettingsView.jsx';
import AuthModal from './components/AuthModal.jsx';
import CallModal from './components/CallModal.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [globalCallSession, setGlobalCallSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    return Boolean(localStorage.getItem('token'));
  });
  const [activeTab, setActiveTab] = useState('chats');
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // 1. Initial Session Restoration (/me)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let isMounted = true;

    const restoreSession = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) {
          setCurrentUser(res.data);
        }
      } catch (err) {
        console.error('Session expired or invalid:', err?.response?.data || err.message);
        localStorage.removeItem('token');
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Chat Rooms & Manage Real-time WebSocket Listeners
  useEffect(() => {
    if (!currentUser?._id) return;

    let isMounted = true;
    connectSocket();

    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/chat/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) {
          setRooms(res.data);
          if (res.data?.length > 0) {
            setActiveRoom((prev) => prev || res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load rooms:', err?.response?.data || err.message);
      } finally {
        if (isMounted) {
          setIsLoadingRooms(false);
        }
      }
    };

    fetchRooms();

    // Online presence listener
    const handlePresenceUpdated = ({ userId, isOnline }) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => ({
          ...room,
          members: room.members?.map((m) =>
            m._id === userId ? { ...m, isOnline } : m
          ),
          isOnline: room.isGroup
            ? room.isOnline
            : room.members?.some((m) => m._id === userId)
              ? isOnline
              : room.isOnline,
        }))
      );

      setActiveRoom((prevActive) => {
        if (!prevActive) return null;
        return {
          ...prevActive,
          members: prevActive.members?.map((m) =>
            m._id === userId ? { ...m, isOnline } : m
          ),
        };
      });
    };

    // Incoming message room order updater
    const handleReceiveMessage = (newMsg) => {
      const targetRoomId = newMsg.roomId || newMsg.room;
      setRooms((prevRooms) => {
        const roomIndex = prevRooms.findIndex((r) => r._id === targetRoomId);
        if (roomIndex === -1) return prevRooms;

        const updatedRoom = {
          ...prevRooms[roomIndex],
          lastMessage: {
            content: newMsg.content || newMsg.file?.name || 'Attachment',
            createdAt: newMsg.createdAt,
          },
          updatedAt: newMsg.createdAt,
        };

        const remaining = prevRooms.filter((r) => r._id !== targetRoomId);
        return [updatedRoom, ...remaining];
      });
    };

    socket.on('presence_updated', handlePresenceUpdated);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      isMounted = false;
      socket.off('presence_updated', handlePresenceUpdated);
      socket.off('receive_message', handleReceiveMessage);
      disconnectSocket();
    };
  }, [currentUser?._id]);

  // 3. Global Incoming WebRTC Call Listener
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setGlobalCallSession({
        isIncoming: true,
        type: data.type,
        roomId: data.roomId || data.from,
        signal: data.signal,
        otherUser: {
          _id: data.from,
          name: data.callerName || 'Incoming Caller',
          avatar: data.avatar || '',
        },
      });
    };

    socket.on('incoming_call', handleIncomingCall);
    return () => socket.off('incoming_call', handleIncomingCall);
  }, []);

  // 4. User Actions
  const handleLogout = () => {
    localStorage.removeItem('token');
    disconnectSocket();
    setCurrentUser(null);
    setRooms([]);
    setActiveRoom(null);
    setActiveTab('chats');
  };

  const handleStartDirectChat = async (contactUser) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms`,
        {
          name: contactUser.name,
          isGroup: false,
          avatar: contactUser.avatar,
          members: [contactUser._id],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRooms((prev) => [res.data, ...prev.filter((r) => r._id !== res.data._id)]);
      setActiveRoom(res.data);
      setActiveTab('chats');
    } catch (err) {
      console.error('Failed to start chat:', err?.response?.data || err.message);
    }
  };

  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    setRooms((prevRooms) =>
      prevRooms.map((room) => ({
        ...room,
        members: room.members?.map((m) =>
          m._id === updatedUser._id ? { ...m, avatar: updatedUser.avatar, name: updatedUser.name } : m
        ),
      }))
    );
  };

  // 5. Session Loading Screen
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8f9fc] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Restoring your session...</p>
      </div>
    );
  }

  // 6. Unauthenticated Modal
  if (!currentUser) {
    return <AuthModal onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] overflow-hidden">
      <SidebarNav
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewChat={() => setActiveTab('contacts')}
        onLogout={handleLogout}
      />

      {/* Main Tab Views */}
      {activeTab === 'chats' && (
        <>
          <ChatList
            rooms={rooms}
            activeRoom={activeRoom}
            isLoading={isLoadingRooms}
            currentUser={currentUser}
            onSelectRoom={setActiveRoom}
          />
          <ChatArea activeRoom={activeRoom} currentUser={currentUser} socket={socket} />
          <DetailsSidebar
            activeRoom={activeRoom}
            currentUser={currentUser}
            onRoomUpdated={(updatedRoom) => {
              setActiveRoom(updatedRoom);
              setRooms((prev) =>
                prev.map((r) => (r._id === updatedRoom._id ? updatedRoom : r))
              );
            }}
          />
        </>
      )}

      {activeTab === 'groups' && (
        <GroupsView
          rooms={rooms}
          onSelectRoom={(room) => {
            setActiveRoom(room);
            setActiveTab('chats');
          }}
          onRoomCreated={(newRoom) => {
            setRooms((prev) => [newRoom, ...prev]);
            setActiveRoom(newRoom);
            setActiveTab('chats');
          }}
        />
      )}

      {activeTab === 'contacts' && (
        <ContactsView onStartChatWithUser={handleStartDirectChat} />
      )}

      {activeTab === 'calls' && (
        <CallsView currentUser={currentUser} socket={socket} />
      )}

      {activeTab === 'saved' && <SavedMessagesView />}

      {activeTab === 'settings' && (
        <SettingsView
          currentUser={currentUser}
          onLogout={handleLogout}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Global Call Screen Overlay */}
      {globalCallSession && (
        <CallModal
          callData={globalCallSession}
          currentUser={currentUser}
          socket={socket}
          onClose={() => setGlobalCallSession(null)}
        />
      )}
    </div>
  );
}