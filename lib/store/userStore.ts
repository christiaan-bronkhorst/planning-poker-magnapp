'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AVATARS } from '@/lib/constants';

interface UserState {
  id: string;
  name: string;
  avatar: string;
  sessionHistory: string[];
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  addToHistory: (sessionId: string) => void;
  generateRandomAvatar: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, _get) => ({
      id: uuidv4(),
      name: '',
      avatar: AVATARS[0],
      sessionHistory: [],

      setName: (name) => set({ name }),
      
      setAvatar: (avatar) => set({ avatar }),
      
      addToHistory: (sessionId) =>
        set((state) => ({
          sessionHistory: [
            sessionId,
            ...state.sessionHistory.filter((id) => id !== sessionId),
          ].slice(0, 10), // Keep last 10 sessions
        })),
        
      generateRandomAvatar: () => {
        const randomIndex = Math.floor(Math.random() * AVATARS.length);
        set({ avatar: AVATARS[randomIndex] });
      },
    }),
    {
      name: 'magnapp-user-preferences',
      partialize: (state) => ({
        id: state.id,
        name: state.name,
        avatar: state.avatar,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);