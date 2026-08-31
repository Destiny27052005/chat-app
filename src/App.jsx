import { useState, useEffect } from 'react';
import axios from 'axios';
import { socket, connectSocket, disconnectSocket } from './socket.js';
import SidebarNav from './components/SidebarNav.jsx';
import ChatList from './components/ChatList.jsx';
import ChatArea from './components/ChatArea.jsx';
import DetailsSidebar from './components/DetailsSidebar.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  // Current user state (replace with your AuthContext/Redux store as needed)
  const [currentUser] = useState({
    _id: '665000000000000000000001',
    name: 'Alex Anderson',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    isOnline: true,
  });

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  useEffect(() => {
    // 1. Establish socket connection with JWT auth
    connectSocket();

    // 2. Fetch initial chat rooms with authorization header
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get(`${API_BASE_URL}/chat/rooms`, { headers: authHeaders })
      .then((res) => {
        setRooms(res.data);
        if (res.data && res.data.length > 0) {
          setActiveRoom(res.data[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load chat rooms:', err?.response?.data || err.message);
      })
      .finally(() => {
        setIsLoadingRooms(false);
      });

    // 3. Socket event handlers
    const handlePresenceUpdated = ({ userId, isOnline }) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => ({
          ...room,
          members: room.members?.map((member) =>
            member._id === userId ? { ...member, isOnline } : member
          ),
        }))
      );

      // Keep activeRoom members in sync
      setActiveRoom((prevActiveRoom) => {
        if (!prevActiveRoom) return null;
        return {
          ...prevActiveRoom,
          members: prevActiveRoom.members?.map((member) =>
            member._id === userId ? { ...member, isOnline } : member
          ),
        };
      });
    };

    const handleConnectError = (err) => {
      console.error('Socket authentication/connection error:', err.message);
    };

    // Register socket listeners
    socket.on('presence_updated', handlePresenceUpdated);
    socket.on('connect_error', handleConnectError);

    // 4. Cleanup on unmount
    return () => {
      socket.off('presence_updated', handlePresenceUpdated);
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [currentUser._id]);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] overflow-hidden">
      <SidebarNav currentUser={currentUser} />
      
      <ChatList 
        rooms={rooms} 
        activeRoom={activeRoom} 
        isLoading={isLoadingRooms}
        onSelectRoom={setActiveRoom} 
      />
      
      <ChatArea 
        activeRoom={activeRoom} 
        currentUser={currentUser} 
        socket={socket} 
      />
      
      <DetailsSidebar 
        activeRoom={activeRoom} 
      />
    </div>
  );
}