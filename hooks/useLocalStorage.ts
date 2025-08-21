'use client';

import { useState, useEffect } from 'react';
import { UserPreferences } from '@/lib/types/user';
import { AVATARS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

interface StorageValue {
  userId: string;
  preferences: UserPreferences;
}

const STORAGE_KEY = 'magnaPokerUser';

export const useLocalStorage = () => {
  const [userId, setUserId] = useState<string>('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    avatar: AVATARS[0],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed: StorageValue = JSON.parse(stored);
        setUserId(parsed.userId);
        setPreferences(parsed.preferences);
      } catch {
        const newId = uuidv4();
        setUserId(newId);
      }
    } else {
      const newId = uuidv4();
      setUserId(newId);
    }
    
    setIsLoaded(true);
  }, []);

  const saveUserPreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    const storageValue: StorageValue = {
      userId,
      preferences: updated,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageValue));
  };

  const resetUser = () => {
    const newId = uuidv4();
    const newPreferences: UserPreferences = {
      name: '',
      avatar: AVATARS[0],
    };
    
    setUserId(newId);
    setPreferences(newPreferences);
    
    const storageValue: StorageValue = {
      userId: newId,
      preferences: newPreferences,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageValue));
  };

  return {
    userId,
    preferences,
    isLoaded,
    saveUserPreferences,
    resetUser,
  };
};