import { io, Socket } from 'socket.io-client';
import { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/types/socket';
import { SOCKET_CONFIG } from '@/lib/constants';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const initializeSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 
                (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    socket = io(url, {
      reconnection: true,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
      reconnectionDelayMax: SOCKET_CONFIG.RECONNECTION_DELAY_MAX,
      timeout: SOCKET_CONFIG.TIMEOUT,
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  }

  return socket;
};

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};