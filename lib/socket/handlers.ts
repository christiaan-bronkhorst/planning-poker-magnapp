'use client';

import { Socket } from 'socket.io-client';
import { useSessionStore } from '@/lib/store/sessionStore';
import { useUserStore } from '@/lib/store/userStore';
import { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/types/socket';
import { VoteValue } from '@/lib/types/vote';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export const setupSocketHandlers = (socket: SocketType) => {
  const sessionStore = useSessionStore.getState();

  // Connection events
  socket.on('connect', () => {
    console.log('Connected to server');
    sessionStore.setConnected(true);
    sessionStore.setError(null);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    sessionStore.setConnected(false);
  });

  // Session events
  socket.on('sessionUpdated', (session) => {
    sessionStore.setCurrentSession(session);
    sessionStore.setLoading(false);
  });

  socket.on('activeSessions', (sessions) => {
    sessionStore.setActiveSessions(sessions);
  });

  socket.on('sessionEnded', (reason) => {
    sessionStore.setCurrentSession(null);
    sessionStore.setError(`Session ended: ${reason}`);
  });

  socket.on('sessionPaused', (message) => {
    sessionStore.setError(message);
  });

  socket.on('sessionResumed', () => {
    sessionStore.setError(null);
  });

  // User events
  socket.on('userJoined', (user) => {
    sessionStore.addUser(user);
  });

  socket.on('userLeft', (userId) => {
    sessionStore.removeUser(userId);
  });

  socket.on('userDisconnected', (userId) => {
    sessionStore.updateUser(userId, { isConnected: false });
  });

  socket.on('userReconnected', (userId) => {
    sessionStore.updateUser(userId, { isConnected: true });
  });

  socket.on('scrumMasterChanged', (newScrumMasterId) => {
    const currentSession = sessionStore.currentSession;
    if (!currentSession) return;

    // Update all users' Scrum Master status
    const updatedUsers = new Map(currentSession.users);
    updatedUsers.forEach((user, userId) => {
      updatedUsers.set(userId, { 
        ...user, 
        isScrumMaster: userId === newScrumMasterId 
      });
    });

    sessionStore.setCurrentSession({
      ...currentSession,
      scrumMasterId: newScrumMasterId,
      users: updatedUsers,
    });
  });

  // Voting events
  socket.on('votingStarted', (round) => {
    sessionStore.setCurrentRound(round);
    
    // Reset all users' vote status
    const currentSession = sessionStore.currentSession;
    if (currentSession) {
      currentSession.users.forEach((_, userId) => {
        sessionStore.setUserVoteStatus(userId, false);
      });
    }
  });

  socket.on('newRoundStarted', (round) => {
    sessionStore.setCurrentRound(round);
    
    // Reset all users' vote status
    const currentSession = sessionStore.currentSession;
    if (currentSession) {
      currentSession.users.forEach((_, userId) => {
        sessionStore.setUserVoteStatus(userId, false);
      });
    }
  });

  socket.on('voteSubmitted', (userId) => {
    sessionStore.setUserVoteStatus(userId, true);
  });

  socket.on('votesRevealed', (votes, statistics) => {
    sessionStore.setVotesRevealed(votes, statistics);
  });

  // Error handling
  socket.on('error', (message) => {
    sessionStore.setError(message);
    sessionStore.setLoading(false);
    
    // Rollback optimistic updates on error
    const userStore = useUserStore.getState();
    sessionStore.rollbackOptimisticVote(userStore.id);
  });

  // Cleanup function
  return () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('sessionUpdated');
    socket.off('activeSessions');
    socket.off('sessionEnded');
    socket.off('sessionPaused');
    socket.off('sessionResumed');
    socket.off('userJoined');
    socket.off('userLeft');
    socket.off('userDisconnected');
    socket.off('userReconnected');
    socket.off('scrumMasterChanged');
    socket.off('votingStarted');
    socket.off('newRoundStarted');
    socket.off('voteSubmitted');
    socket.off('votesRevealed');
    socket.off('error');
  };
};

export const createSessionActions = (socket: SocketType) => {
  const sessionStore = useSessionStore.getState();
  const userStore = useUserStore.getState();

  return {
    createSession: (name: string) => {
      sessionStore.setLoading(true);
      sessionStore.setError(null);
      
      socket.emit('createSession', name, {
        id: userStore.id,
        name: userStore.name,
        avatar: userStore.avatar,
      });
    },

    joinSession: (sessionId: string) => {
      sessionStore.setLoading(true);
      sessionStore.setError(null);
      
      socket.emit('joinSession', sessionId, {
        id: userStore.id,
        name: userStore.name,
        avatar: userStore.avatar,
      });
    },

    leaveSession: () => {
      socket.emit('leaveSession');
    },

    startVoting: () => {
      socket.emit('startVoting');
    },

    submitVote: (value: VoteValue) => {
      // Optimistic update
      sessionStore.optimisticVote(userStore.id, value);
      socket.emit('submitVote', value);
    },

    revealVotes: () => {
      socket.emit('revealVotes');
    },

    startNewRound: () => {
      socket.emit('startNewRound');
    },

    endSession: () => {
      socket.emit('endSession');
    },

    kickUser: (userId: string) => {
      socket.emit('kickUser', userId);
    },

    transferScrumMaster: (userId: string) => {
      socket.emit('transferScrumMaster', userId);
    },

    getActiveSessions: () => {
      socket.emit('getActiveSessions');
    },

    reconnect: (sessionId: string) => {
      socket.emit('reconnect', sessionId, userStore.id);
    },
  };
};