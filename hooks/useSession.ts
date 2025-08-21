'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket/client';
import { useSocketEvent } from '@/hooks/useSocket';
import { Session, VotingRound } from '@/lib/types/session';
import { SessionUser } from '@/lib/types/user';
import { VoteValue, VoteStatistics } from '@/lib/types/vote';
import { SESSION_LIMITS } from '@/lib/constants';

interface UseSessionReturn {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  currentUser: SessionUser | null;
  isScrumMaster: boolean;
  votingRound: VotingRound | null;
  votingStatus: Map<string, boolean>;
  voteStatistics: VoteStatistics | null;
  startVoting: () => void;
  submitVote: (value: VoteValue) => void;
  revealVotes: () => void;
  startNewRound: () => void;
  endSession: () => void;
  kickUser: (userId: string) => void;
  transferScrumMaster: (userId: string) => void;
  leaveSession: () => void;
}

export const useSession = (sessionId: string, userId: string): UseSessionReturn => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingStatus, setVotingStatus] = useState<Map<string, boolean>>(new Map());
  const [voteStatistics, setVoteStatistics] = useState<VoteStatistics | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionExpiryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const currentUser = session ? session.users.get(userId) || null : null;
  const isScrumMaster = currentUser?.isScrumMaster || false;
  const votingRound = session?.currentRound || null;

  // Socket event handlers
  useSocketEvent('sessionUpdated', (updatedSession: Session) => {
    setSession(updatedSession);
    setIsLoading(false);
    setError(null);
    updateVotingStatus(updatedSession);
  });

  useSocketEvent('userJoined', (user: SessionUser) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      updated.users.set(user.id, user);
      return updated;
    });
  });

  useSocketEvent('userLeft', (userId: string) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      updated.users.delete(userId);
      return updated;
    });
    setVotingStatus(prev => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
  });

  useSocketEvent('userDisconnected', (userId: string) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      const user = updated.users.get(userId);
      if (user) {
        user.isConnected = false;
      }
      return updated;
    });
  });

  useSocketEvent('userReconnected', (userId: string) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      const user = updated.users.get(userId);
      if (user) {
        user.isConnected = true;
      }
      return updated;
    });
  });

  useSocketEvent('votingStarted', (round: VotingRound) => {
    setSession(prev => {
      if (!prev) return null;
      return { ...prev, currentRound: round };
    });
    setVotingStatus(new Map());
    setVoteStatistics(null);
  });

  useSocketEvent('voteSubmitted', (voterId: string) => {
    setVotingStatus(prev => {
      const updated = new Map(prev);
      updated.set(voterId, true);
      return updated;
    });
  });

  useSocketEvent('votesRevealed', (votes: Array<{ userId: string; value: VoteValue }>, statistics: VoteStatistics) => {
    setSession(prev => {
      if (!prev || !prev.currentRound) return prev;
      const updated = { ...prev };
      updated.currentRound!.isRevealed = true;
      updated.currentRound!.revealedAt = new Date();
      votes.forEach(vote => {
        updated.currentRound!.votes.set(vote.userId, {
          userId: vote.userId,
          value: vote.value,
          submittedAt: new Date(),
        });
      });
      return updated;
    });
    setVoteStatistics(statistics);
  });

  useSocketEvent('newRoundStarted', (round: VotingRound) => {
    setSession(prev => {
      if (!prev) return null;
      return { ...prev, currentRound: round };
    });
    setVotingStatus(new Map());
    setVoteStatistics(null);
  });

  useSocketEvent('sessionEnded', (reason: string) => {
    setError(reason);
    setTimeout(() => {
      router.push('/');
    }, 3000);
  });

  useSocketEvent('scrumMasterChanged', (newScrumMasterId: string) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      updated.users.forEach(user => {
        user.isScrumMaster = user.id === newScrumMasterId;
      });
      updated.scrumMasterId = newScrumMasterId;
      return updated;
    });
  });

  useSocketEvent('sessionPaused', (reason: string) => {
    setSession(prev => {
      if (!prev) return null;
      return { ...prev, isPaused: true };
    });
    setError(reason);

    // Start countdown for Scrum Master grace period
    sessionExpiryTimeoutRef.current = setTimeout(() => {
      setError('Session expired - Scrum Master did not return');
      router.push('/');
    }, SESSION_LIMITS.SCRUM_MASTER_GRACE_PERIOD_MINUTES * 60 * 1000);
  });

  useSocketEvent('sessionResumed', () => {
    setSession(prev => {
      if (!prev) return null;
      return { ...prev, isPaused: false };
    });
    setError(null);

    // Clear expiry timeout
    if (sessionExpiryTimeoutRef.current) {
      clearTimeout(sessionExpiryTimeoutRef.current);
    }
  });

  useSocketEvent('sessionExpiring', (secondsRemaining: number) => {
    if (secondsRemaining <= 60) {
      setError(`Session expiring in ${secondsRemaining} seconds due to inactivity`);
    }
  });

  useSocketEvent('error', (message: string) => {
    setError(message);
  });

  const updateVotingStatus = (session: Session) => {
    if (!session.currentRound) {
      setVotingStatus(new Map());
      return;
    }

    const status = new Map<string, boolean>();
    session.users.forEach(user => {
      status.set(user.id, session.currentRound!.votes.has(user.id));
    });
    setVotingStatus(status);
  };

  // Socket actions
  const startVoting = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('startVoting');
    }
  }, []);

  const submitVote = useCallback((value: VoteValue) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('submitVote', value);
    }
  }, []);

  const revealVotes = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('revealVotes');
    }
  }, []);

  const startNewRound = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('startNewRound');
    }
  }, []);

  const endSession = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('endSession');
    }
  }, []);

  const kickUser = useCallback((userId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('kickUser', userId);
    }
  }, []);

  const transferScrumMaster = useCallback((userId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('transferScrumMaster', userId);
    }
  }, []);

  const leaveSession = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('leaveSession');
      router.push('/');
    }
  }, [router]);

  // Reconnection logic
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDisconnect = () => {
      setError('Connection lost. Attempting to reconnect...');
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!socket.connected) {
          setError('Failed to reconnect. Please refresh the page.');
        }
      }, 30000); // 30 seconds timeout
    };

    const handleConnect = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Attempt to rejoin session if we were previously connected
      if (sessionId && userId && session) {
        socket.emit('reconnect', sessionId, userId);
      }
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (sessionExpiryTimeoutRef.current) {
        clearTimeout(sessionExpiryTimeoutRef.current);
      }
    };
  }, [sessionId, userId, session]);

  return {
    session,
    isLoading,
    error,
    currentUser,
    isScrumMaster,
    votingRound,
    votingStatus,
    voteStatistics,
    startVoting,
    submitVote,
    revealVotes,
    startNewRound,
    endSession,
    kickUser,
    transferScrumMaster,
    leaveSession,
  };
};