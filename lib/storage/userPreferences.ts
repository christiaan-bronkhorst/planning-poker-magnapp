import { v4 as uuidv4 } from 'uuid';

export interface UserPreferences {
  id: string;
  name: string;
  avatar: string;
  lastUpdated: Date;
}

const STORAGE_KEY = 'magnapp_user_preferences';

export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated),
      };
    }
  } catch (error) {
    console.error('Error reading user preferences:', error);
  }

  return null;
}

export function saveUserPreferences(preferences: Omit<UserPreferences, 'id' | 'lastUpdated'>): UserPreferences {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save preferences on server side');
  }

  const existing = getUserPreferences();
  const updated: UserPreferences = {
    id: existing?.id || generateUserId(),
    name: preferences.name,
    avatar: preferences.avatar,
    lastUpdated: new Date(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw new Error('Failed to save user preferences');
  }
}

export function generateUserId(): string {
  return uuidv4();
}

export function clearUserPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user preferences:', error);
  }
}

export function validateUserName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Name must be 20 characters or less' };
  }

  if (!/^[a-zA-Z0-9\s-_]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { valid: true };
}