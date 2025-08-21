import { SessionManager } from '@/lib/session/SessionManager';
import { Server as SocketIOServer } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@/lib/types/socket';

export let sessionManagerInstance: SessionManager | null = null;
let ioInstance: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export function resetSessionManager(): void {
  sessionManagerInstance = null;
}

export function setSocketIO(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
  ioInstance = io;
}

export function getSocketIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null {
  return ioInstance;
}

export function emitToSession(sessionId: string, event: string, ...args: any[]): void {
  const io = getSocketIO();
  if (io) {
    io.to(sessionId).emit(event as any, ...args);
  }
}

export function emitToAll(event: string, ...args: any[]): void {
  const io = getSocketIO();
  if (io) {
    io.emit(event as any, ...args);
  }
}

export function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('x-user-id');
  return authHeader || null;
}

export function getSessionIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/sessions\/([^\/]+)/);
  return match ? match[1] : null;
}