'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, getSocket, disconnectSocket } from '@/lib/socket/client';
import { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/types/socket';

export interface UseSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: <K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const connect = useCallback(() => {
    const socketInstance = initializeSocket();
    
    if (!socketInstance.connected) {
      socketInstance.connect();
    }

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsConnected(false);
    setSocket(null);
  }, []);

  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    const currentSocket = getSocket();
    if (currentSocket && currentSocket.connected) {
      currentSocket.emit(event, ...args);
    }
  }, []);

  useEffect(() => {
    return () => {
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.off('connect');
        currentSocket.off('disconnect');
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    emit,
  };
};

export const useSocketEvent = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const wrappedHandler = (...args: any[]) => {
      (handlerRef.current as any)(...args);
    };

    socket.on(event, wrappedHandler as any);

    return () => {
      socket.off(event, wrappedHandler as any);
    };
  }, [event]);
};