export interface User {
  id: string;
  name: string;
  avatar: string;
  sessionId?: string;
  connectionId?: string;
}

export interface UserPreferences {
  name: string;
  avatar: string;
}

export interface SessionUser extends User {
  isConnected: boolean;
  hasVoted: boolean;
  isScrumMaster: boolean;
  joinedAt: Date;
}