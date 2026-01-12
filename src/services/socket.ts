import { io, Socket } from 'socket.io-client';
import { storage } from '../utils/storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket: Socket | null = null;

export const initSocket = async (): Promise<Socket | null> => {
  try {
    const token = await storage.getItem('auth_token');

    if (!token) {
      return null;
    }

    if (socket?.connected) {
      return socket;
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    return null;
  }
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinConnection = (connectionId: string) => {
  socket?.emit('join-connection', connectionId);
};

export const leaveConnection = (connectionId: string) => {
  socket?.emit('leave-connection', connectionId);
};

export const emitTyping = (connectionId: string, isTyping: boolean) => {
  socket?.emit('typing', { connectionId, isTyping });
};

// Socket event types
export const SocketEvents = {
  NEW_MESSAGE: 'new-message',
  MESSAGE_READ: 'message-read',
  MISSION_RESPONSE: 'mission:response',
  MISSION_COMPLETED: 'mission:completed',
  MISSION_VOTE: 'mission:vote',
  MISSION_SELECTED: 'mission:selected',
  PROGRESS_UPDATE: 'progress-update',
  CHAT_UNLOCKED: 'chat-unlocked',
  CONNECTION_REQUEST: 'connection-request',
  CONNECTION_ACCEPTED: 'connection-accepted',
  USER_TYPING: 'user-typing',
  PRESENCE_JOINED: 'presence:joined',
  PRESENCE_LEFT: 'presence:left',
};
