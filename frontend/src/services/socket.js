import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  auth: {
    token:
      localStorage.getItem('userToken') ||
      localStorage.getItem('adminToken') ||
      localStorage.getItem('token') ||
      '',
  },
});

export const joinAdminRoom = () => {
  socket.emit('join_admin');
};

// Re-auth the socket after login/logout so the admin room verification
// (and any future token-based checks) always sees the current user's token.
export const updateSocketToken = (token) => {
  socket.auth = { ...(socket.auth || {}), token: token || '' };
  if (socket.connected) {
    socket.disconnect();
    socket.connect();
  }
};

export const joinUserRoom = (userId) => {
  if (userId) {
    socket.emit('join_user', userId);
  }
};
