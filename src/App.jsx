import { useState, useEffect } from 'react';
import axios from 'axios';
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // 1. Initial Authentication Check (/me)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCurrentUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
      });
  }, []);

  // 2. Fetch Chat Rooms & Sockets when authenticated
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
        console.error('Failed to load rooms:', err);
      } finally {
        if (isMounted) {
          setIsLoadingRooms(false);
        }
      }
    };

    fetchRooms();

    // Listen for real-time presence changes
    const handlePresenceUpdated = ({ userId, isOnline }) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => ({
          ...room,
          members: room.members?.map((m) =>
            m._id === userId ? { ...m, isOnline } : m
          ),
          isOnline: room.isGroup ? room.isOnline : (room.members?.find((m) => m._id === userId) ? isOnline : room.isOnline),
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

    // Listen for incoming messages to update chat list previews & sort order
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
        };

        // Move active room to top
        const filtered = prevRooms.filter((r) => r._id !== targetRoomId);
        return [updatedRoom, ...filtered];
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

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    disconnectSocket();
    setCurrentUser(null);
    setRooms([]);
    setActiveRoom(null);
    setActiveTab('chats');
  };

  // 4. Start Direct Chat from Contacts Directory
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
      console.error('Failed to start chat:', err);
    }
  };

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

      {/* Conditional Views */}
      {activeTab === 'chats' && (
        <>
          <ChatList
            rooms={rooms}
            activeRoom={activeRoom}
            isLoading={isLoadingRooms}
            onSelectRoom={setActiveRoom}
          />
          <ChatArea activeRoom={activeRoom} currentUser={currentUser} socket={socket} />
          <DetailsSidebar activeRoom={activeRoom} />
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

      {activeTab === 'calls' && <CallsView />}

      {activeTab === 'saved' && <SavedMessagesView />}

      {activeTab === 'settings' && (
        <SettingsView currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}