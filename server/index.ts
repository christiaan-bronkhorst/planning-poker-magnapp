import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SessionManager } from '@/lib/session/SessionManager';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@/lib/types/socket';
import { SessionUser } from '@/lib/types/user';
import { MESSAGES } from '@/lib/constants';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const sessionManager = new SessionManager();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.APP_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('createSession', (name, user) => {
      try {
        const sessionUser: SessionUser = {
          ...user,
          isConnected: true,
          hasVoted: false,
          isScrumMaster: true,
          joinedAt: new Date(),
          connectionId: socket.id,
        };

        const session = sessionManager.createSession(name, sessionUser);
        
        socket.data.userId = user.id;
        socket.data.sessionId = session.id;
        socket.data.userName = user.name;
        
        socket.join(session.id);
        socket.emit('sessionUpdated', session);
        io.emit('activeSessions', sessionManager.getActiveSessions());
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to create session');
      }
    });

    socket.on('joinSession', (sessionId, user) => {
      try {
        const sessionUser: SessionUser = {
          ...user,
          isConnected: true,
          hasVoted: false,
          isScrumMaster: false,
          joinedAt: new Date(),
          connectionId: socket.id,
        };

        const session = sessionManager.joinSession(sessionId, sessionUser);
        
        socket.data.userId = user.id;
        socket.data.sessionId = sessionId;
        socket.data.userName = user.name;
        
        socket.join(sessionId);
        socket.emit('sessionUpdated', session);
        socket.to(sessionId).emit('userJoined', sessionUser);
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to join session');
      }
    });

    socket.on('leaveSession', () => {
      handleUserLeave(socket, false);
    });

    socket.on('startVoting', () => {
      const { sessionId, userId } = socket.data;
      if (!sessionId || !userId) return;

      try {
        const session = sessionManager.getSession(sessionId);
        if (!session || session.scrumMasterId !== userId) {
          socket.emit('error', MESSAGES.NOT_AUTHORIZED);
          return;
        }

        const round = sessionManager.startVotingRound(sessionId);
        io.to(sessionId).emit('votingStarted', round);
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to start voting');
      }
    });

    socket.on('submitVote', (value) => {
      const { sessionId, userId } = socket.data;
      if (!sessionId || !userId) return;

      try {
        sessionManager.submitVote(sessionId, userId, value);
        io.to(sessionId).emit('voteSubmitted', userId);
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to submit vote');
      }
    });

    socket.on('revealVotes', () => {
      const { sessionId, userId } = socket.data;
      if (!sessionId || !userId) return;

      try {
        const session = sessionManager.getSession(sessionId);
        if (!session || session.scrumMasterId !== userId) {
          socket.emit('error', MESSAGES.NOT_AUTHORIZED);
          return;
        }

        const { votes, statistics } = sessionManager.revealVotes(sessionId);
        const voteData = votes.map(v => ({ userId: v.userId, value: v.value }));
        io.to(sessionId).emit('votesRevealed', voteData, statistics);
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to reveal votes');
      }
    });

    socket.on('startNewRound', () => {
      const { sessionId, userId } = socket.data;
      if (!sessionId || !userId) return;

      try {
        const session = sessionManager.getSession(sessionId);
        if (!session || session.scrumMasterId !== userId) {
          socket.emit('error', MESSAGES.NOT_AUTHORIZED);
          return;
        }

        const round = sessionManager.startVotingRound(sessionId);
        io.to(sessionId).emit('newRoundStarted', round);
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to start new round');
      }
    });

    socket.on('endSession', () => {
      const { sessionId, userId } = socket.data;
      if (!sessionId || !userId) return;

      try {
        const session = sessionManager.getSession(sessionId);
        if (!session || session.scrumMasterId !== userId) {
          socket.emit('error', MESSAGES.NOT_AUTHORIZED);
          return;
        }

        sessionManager.endSession(sessionId);
        io.to(sessionId).emit('sessionEnded', 'Session ended by Scrum Master');
        io.socketsLeave(sessionId);
        io.emit('activeSessions', sessionManager.getActiveSessions());
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to end session');
      }
    });

    socket.on('kickUser', (kickUserId) => {
      const { sessionId, userId } = socket.data;
      if (!sessionId || !userId) return;

      try {
        const session = sessionManager.getSession(sessionId);
        if (!session || session.scrumMasterId !== userId) {
          socket.emit('error', MESSAGES.NOT_AUTHORIZED);
          return;
        }

        const kickedUserSocket = [...io.sockets.sockets.values()]
          .find(s => s.data.userId === kickUserId && s.data.sessionId === sessionId);
        
        if (kickedUserSocket) {
          kickedUserSocket.emit('error', 'You have been removed from the session');
          kickedUserSocket.leave(sessionId);
          kickedUserSocket.data.userId = '';
          kickedUserSocket.data.sessionId = undefined;
          kickedUserSocket.data.userName = '';
        }

        const updatedSession = sessionManager.removeUserFromSession(sessionId, kickUserId);
        if (updatedSession) {
          io.to(sessionId).emit('userLeft', kickUserId);
          io.to(sessionId).emit('sessionUpdated', updatedSession);
        }
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to kick user');
      }
    });

    socket.on('transferScrumMaster', (newScrumMasterId) => {
      const { sessionId, userId } = socket.data;
      if (!sessionId || !userId) return;

      try {
        const session = sessionManager.getSession(sessionId);
        if (!session || session.scrumMasterId !== userId) {
          socket.emit('error', MESSAGES.NOT_AUTHORIZED);
          return;
        }

        const newScrumMaster = session.users.get(newScrumMasterId);
        if (!newScrumMaster) {
          socket.emit('error', 'User not found in session');
          return;
        }

        const currentScrumMaster = session.users.get(userId);
        if (currentScrumMaster) {
          currentScrumMaster.isScrumMaster = false;
        }

        newScrumMaster.isScrumMaster = true;
        session.scrumMasterId = newScrumMasterId;

        io.to(sessionId).emit('scrumMasterChanged', newScrumMasterId);
        io.to(sessionId).emit('sessionUpdated', session);
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to transfer role');
      }
    });

    socket.on('getActiveSessions', () => {
      socket.emit('activeSessions', sessionManager.getActiveSessions());
    });

    socket.on('reconnect', (sessionId, userId) => {
      try {
        const session = sessionManager.reconnectUser(sessionId, userId);
        if (session) {
          socket.data.userId = userId;
          socket.data.sessionId = sessionId;
          socket.join(sessionId);
          
          socket.emit('sessionUpdated', session);
          socket.to(sessionId).emit('userReconnected', userId);
          
          if (session.scrumMasterId === userId && !session.isPaused) {
            io.to(sessionId).emit('sessionResumed');
          }
        } else {
          socket.emit('error', MESSAGES.SESSION_NOT_FOUND);
        }
      } catch (error) {
        socket.emit('error', error instanceof Error ? error.message : 'Failed to reconnect');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      handleUserLeave(socket, true);
    });
  });

  function handleUserLeave(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    isDisconnection: boolean
  ) {
    const { sessionId, userId } = socket.data;
    if (!sessionId || !userId) return;

    const session = sessionManager.getSession(sessionId);
    if (!session) return;

    if (isDisconnection) {
      const user = session.users.get(userId);
      if (user) {
        user.isConnected = false;
        socket.to(sessionId).emit('userDisconnected', userId);
        
        if (session.scrumMasterId === userId) {
          socket.to(sessionId).emit('sessionPaused', MESSAGES.SCRUM_MASTER_DISCONNECTED);
        }
      }
    } else {
      const updatedSession = sessionManager.removeUserFromSession(sessionId, userId);
      if (updatedSession) {
        socket.to(sessionId).emit('userLeft', userId);
        socket.to(sessionId).emit('sessionUpdated', updatedSession);
        
        if (updatedSession.scrumMasterId !== userId && updatedSession.isPaused) {
          io.to(sessionId).emit('scrumMasterChanged', updatedSession.scrumMasterId);
        }
      }
      socket.leave(sessionId);
      socket.data.userId = '';
      socket.data.sessionId = undefined;
      socket.data.userName = '';
      io.emit('activeSessions', sessionManager.getActiveSessions());
    }
  }

  // Periodic cleanup of expired sessions
  setInterval(() => {
    sessionManager.expireInactiveSessions();
  }, 60000); // Check every minute

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});