import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    // Dynamically fetch the token whenever a connection is initiated
    const token = localStorage.getItem('token');
    cb({ token });
  }
});

// Helper to manually trigger connection after login
export const connectSocket = (userId) => {
  const token = localStorage.getItem('token');
  if (token && !socket.connected) {
    socket.auth = { token };
    socket.connect();
    if (userId) {
      socket.emit('user_connected', userId);
    }
  }
};

// Helper to disconnect on logout
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};