'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserPreferences, 
  getUserPreferences, 
  saveUserPreferences, 
  clearUserPreferences 
} from '@/lib/storage/userPreferences';
import { getRandomAvatar } from '@/lib/constants/avatars';

interface UseUserReturn {
  user: UserPreferences | null;
  isLoading: boolean;
  hasSetup: boolean;
  updateUser: (name: string, avatar: string) => Promise<UserPreferences>;
  clearUser: () => void;
  refreshUser: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSetup, setHasSetup] = useState(false);

  const loadUserPreferences = useCallback(() => {
    try {
      const preferences = getUserPreferences();
      setUser(preferences);
      setHasSetup(!!preferences);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserPreferences();
  }, [loadUserPreferences]);

  const updateUser = useCallback(async (name: string, avatar: string): Promise<UserPreferences> => {
    try {
      const updated = saveUserPreferences({ name, avatar });
      setUser(updated);
      setHasSetup(true);
      return updated;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, []);

  const clearUser = useCallback(() => {
    clearUserPreferences();
    setUser(null);
    setHasSetup(false);
  }, []);

  const refreshUser = useCallback(() => {
    loadUserPreferences();
  }, [loadUserPreferences]);

  return {
    user,
    isLoading,
    hasSetup,
    updateUser,
    clearUser,
    refreshUser,
  };
}

export function generateDefaultUser(): { name: string; avatar: string } {
  const avatar = getRandomAvatar();
  return {
    name: '',
    avatar: avatar.id,
  };
}