import { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from './socket.js';
import SidebarNav from './components/SidebarNav.jsx';
import ChatList from './components/ChatList.jsx';
import ChatArea from './components/ChatArea.jsx';
import DetailsSidebar from './components/DetailsSidebar.jsx';

export default function App() {
  // Mock current logged-in user profile (or fetch from Auth state/context)
  const [currentUser] = useState({
    _id: '665000000000000000000001',
    name: 'Alex Anderson',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    isOnline: true
  });

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    // 1. Establish Socket Connection
    socket.connect();
    socket.emit('user_connected', currentUser._id);

    // 2. Fetch Chat Rooms
    axios.get('http://localhost:5000/api/chat/rooms')
      .then((res) => {
        setRooms(res.data);
        if (res.data.length > 0) {
          setActiveRoom(res.data[0]);
        }
      })
      .catch((err) => console.error('Failed to load rooms:', err));

    // 3. Listen for online status updates across users
    socket.on('presence_updated', ({ userId, isOnline }) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => ({
          ...room,
          members: room.members?.map((m) =>
            m._id === userId ? { ...m, isOnline } : m
          )
        }))
      );
    });

    return () => {
      socket.disconnect();
      socket.off('presence_updated');
    };
  }, [currentUser]);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] overflow-hidden">
      <SidebarNav currentUser={currentUser} />
      <ChatList rooms={rooms} activeRoom={activeRoom} onSelectRoom={setActiveRoom} />
      <ChatArea activeRoom={activeRoom} currentUser={currentUser} socket={socket} />
      <DetailsSidebar activeRoom={activeRoom} />
    </div>
  );
}