'use client';

import { create } from 'zustand';
import { Session, SessionSummary, VotingRound } from '@/lib/types/session';
import { SessionUser } from '@/lib/types/user';
import { VoteValue, VoteStatistics } from '@/lib/types/vote';

interface SessionState {
  // Current session state
  currentSession: Session | null;
  activeSessions: SessionSummary[];
  
  // UI state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentSession: (session: Session | null) => void;
  setActiveSessions: (sessions: SessionSummary[]) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Session actions
  updateUser: (userId: string, updates: Partial<SessionUser>) => void;
  removeUser: (userId: string) => void;
  addUser: (user: SessionUser) => void;
  
  // Voting actions
  setCurrentRound: (round: VotingRound | undefined) => void;
  setUserVoteStatus: (userId: string, hasVoted: boolean) => void;
  setVotesRevealed: (votes: { userId: string; value: VoteValue }[], stats: VoteStatistics) => void;
  
  // Optimistic updates
  optimisticVote: (userId: string, value: VoteValue) => void;
  rollbackOptimisticVote: (userId: string) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  currentSession: null,
  activeSessions: [],
  isConnected: false,
  isLoading: false,
  error: null,
};

export const useSessionStore = create<SessionState>((set, _get) => ({
  ...initialState,

  setCurrentSession: (session) => set({ currentSession: session }),
  
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  updateUser: (userId, updates) =>
    set((state) => {
      if (!state.currentSession) return state;

      const updatedUsers = new Map(state.currentSession.users);
      const user = updatedUsers.get(userId);
      
      if (user) {
        updatedUsers.set(userId, { ...user, ...updates });
      }

      return {
        currentSession: {
          ...state.currentSession,
          users: updatedUsers,
        },
      };
    }),

  removeUser: (userId) =>
    set((state) => {
      if (!state.currentSession) return state;

      const updatedUsers = new Map(state.currentSession.users);
      updatedUsers.delete(userId);

      return {
        currentSession: {
          ...state.currentSession,
          users: updatedUsers,
        },
      };
    }),

  addUser: (user) =>
    set((state) => {
      if (!state.currentSession) return state;

      const updatedUsers = new Map(state.currentSession.users);
      updatedUsers.set(user.id, user);

      return {
        currentSession: {
          ...state.currentSession,
          users: updatedUsers,
        },
      };
    }),

  setCurrentRound: (round) =>
    set((state) => {
      if (!state.currentSession) return state;

      return {
        currentSession: {
          ...state.currentSession,
          currentRound: round,
        },
      };
    }),

  setUserVoteStatus: (userId, hasVoted) =>
    set((state) => {
      if (!state.currentSession) return state;

      const updatedUsers = new Map(state.currentSession.users);
      const user = updatedUsers.get(userId);
      
      if (user) {
        updatedUsers.set(userId, { ...user, hasVoted });
      }

      return {
        currentSession: {
          ...state.currentSession,
          users: updatedUsers,
        },
      };
    }),

  setVotesRevealed: (votes, _stats) =>
    set((state) => {
      if (!state.currentSession?.currentRound) return state;

      // Update vote status for all users
      const updatedUsers = new Map(state.currentSession.users);
      votes.forEach(({ userId }) => {
        const user = updatedUsers.get(userId);
        if (user) {
          updatedUsers.set(userId, { ...user, hasVoted: true });
        }
      });

      // Create revealed round
      const revealedRound: VotingRound = {
        ...state.currentSession.currentRound,
        isRevealed: true,
        revealedAt: new Date(),
      };

      return {
        currentSession: {
          ...state.currentSession,
          users: updatedUsers,
          currentRound: revealedRound,
        },
      };
    }),

  optimisticVote: (userId, _value) =>
    set((state) => {
      if (!state.currentSession?.currentRound) return state;

      // Optimistically mark user as voted
      const updatedUsers = new Map(state.currentSession.users);
      const user = updatedUsers.get(userId);
      
      if (user) {
        updatedUsers.set(userId, { ...user, hasVoted: true });
      }

      return {
        currentSession: {
          ...state.currentSession,
          users: updatedUsers,
        },
      };
    }),

  rollbackOptimisticVote: (userId) =>
    set((state) => {
      if (!state.currentSession) return state;

      // Rollback optimistic vote
      const updatedUsers = new Map(state.currentSession.users);
      const user = updatedUsers.get(userId);
      
      if (user) {
        updatedUsers.set(userId, { ...user, hasVoted: false });
      }

      return {
        currentSession: {
          ...state.currentSession,
          users: updatedUsers,
        },
      };
    }),

  reset: () => set(initialState),
}));