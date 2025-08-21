'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SessionSummary } from '@/lib/types/session';
import { User } from '@/lib/types/user';
import { AVATARS, SESSION_LIMITS } from '@/lib/constants';
import { validateSessionId, formatSessionTime, generateSessionName } from '@/utils/sessionHelpers';

export default function SessionLobby() {
  const router = useRouter();
  const { userId, preferences, saveUserPreferences, isLoaded } = useLocalStorage();
  const { connect, disconnect, emit, isConnected } = useSocket();
  
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const [sessionName, setSessionName] = useState('');
  const [sessionIdToJoin, setSessionIdToJoin] = useState('');
  const [activeSessions, setActiveSessions] = useState<SessionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setUserName(preferences.name);
      setSelectedAvatar(preferences.avatar);
      setSessionName(generateSessionName());
    }
  }, [isLoaded, preferences]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (isConnected) {
      emit('getActiveSessions');
    }
  }, [isConnected, emit]);

  useSocketEvent('activeSessions', (sessions: SessionSummary[]) => {
    setActiveSessions(sessions);
  });

  useSocketEvent('sessionUpdated', () => {
    const sessionId = sessionIdToJoin || sessionName;
    router.push(`/session/${sessionId}`);
  });

  useSocketEvent('error', (message: string) => {
    setError(message);
    setIsCreating(false);
    setIsJoining(false);
  });

  const handleCreateSession = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    setError(null);
    setIsCreating(true);
    saveUserPreferences({ name: userName, avatar: selectedAvatar });

    const user: User = {
      id: userId,
      name: userName,
      avatar: selectedAvatar,
    };

    emit('createSession', sessionName, user);
  };

  const handleJoinSession = (sessionId?: string) => {
    const targetSessionId = sessionId || sessionIdToJoin;
    
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!targetSessionId || !validateSessionId(targetSessionId)) {
      setError('Invalid session ID');
      return;
    }

    setError(null);
    setIsJoining(true);
    saveUserPreferences({ name: userName, avatar: selectedAvatar });

    const user: User = {
      id: userId,
      name: userName,
      avatar: selectedAvatar,
    };

    emit('joinSession', targetSessionId, user);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">🎯 MagnaPP</h1>
          <p className="text-xl text-gray-600">Planning Poker for Agile Teams</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* User Profile Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        selectedAvatar === avatar
                          ? 'bg-blue-500 shadow-lg scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Create Session Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sprint Planning"
                  maxLength={50}
                />
              </div>

              <button
                onClick={handleCreateSession}
                disabled={!isConnected || isCreating || activeSessions.length >= SESSION_LIMITS.MAX_CONCURRENT_SESSIONS}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Session as Scrum Master'}
              </button>

              {activeSessions.length >= SESSION_LIMITS.MAX_CONCURRENT_SESSIONS && (
                <p className="text-sm text-red-600">
                  Maximum concurrent sessions ({SESSION_LIMITS.MAX_CONCURRENT_SESSIONS}) reached
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Join Session Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Join Session</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={sessionIdToJoin}
                onChange={(e) => setSessionIdToJoin(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter session ID (GUID)"
              />
              <button
                onClick={() => handleJoinSession()}
                disabled={!isConnected || isJoining}
                className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Active Sessions</h3>
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{session.name}</p>
                        <p className="text-sm text-gray-600">
                          {session.userCount}/{SESSION_LIMITS.MAX_USERS_PER_SESSION} users • 
                          Created {formatSessionTime(session.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        disabled={!isConnected || isJoining || session.userCount >= SESSION_LIMITS.MAX_USERS_PER_SESSION}
                        className="bg-blue-600 text-white py-1 px-4 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {session.userCount >= SESSION_LIMITS.MAX_USERS_PER_SESSION ? 'Full' : 'Join'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
            Connecting to server...
          </div>
        )}
      </div>
    </div>
  );
}