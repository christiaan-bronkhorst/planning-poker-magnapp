'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store/sessionStore';
import { useUserStore } from '@/lib/store/userStore';
import { useSocket } from '@/hooks/useSocket';
import { setupSocketHandlers, createSessionActions } from '@/lib/socket/handlers';
import { AVATARS } from '@/lib/constants';

export const SessionLobby = () => {
  const router = useRouter();
  const { socket, isConnected, connect } = useSocket();
  const { activeSessions, isLoading, error } = useSessionStore();
  const { name, avatar, setName, setAvatar, generateRandomAvatar, addToHistory } = useUserStore();
  
  const [sessionName, setSessionName] = useState('');
  const [showNameForm, setShowNameForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  useEffect(() => {
    if (socket && isConnected) {
      const cleanup = setupSocketHandlers(socket);
      const actions = createSessionActions(socket);
      
      // Get active sessions on connect
      actions.getActiveSessions();
      
      return cleanup;
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!name) {
      setShowNameForm(true);
    }
  }, [name]);

  const handleCreateSession = async () => {
    if (!socket || !sessionName.trim() || !name.trim()) return;
    
    setIsCreating(true);
    const actions = createSessionActions(socket);
    actions.createSession(sessionName.trim());
    
    // The sessionUpdated event will trigger navigation
  };

  const handleJoinSession = (sessionId: string) => {
    if (!socket || !name.trim()) return;
    
    const actions = createSessionActions(socket);
    actions.joinSession(sessionId);
    addToHistory(sessionId);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setShowNameForm(false);
    }
  };

  const currentSession = useSessionStore((state) => state.currentSession);
  
  useEffect(() => {
    // Navigate to session when one is joined/created
    if (currentSession && !isCreating) {
      router.push(`/session/${currentSession.id}`);
    } else if (currentSession && isCreating) {
      setIsCreating(false);
      router.push(`/session/${currentSession.id}`);
    }
  }, [currentSession, router, isCreating]);

  if (showNameForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Welcome to MagnaPP
          </h1>
          
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {AVATARS.map((avatarEmoji) => (
                  <button
                    key={avatarEmoji}
                    type="button"
                    onClick={() => setAvatar(avatarEmoji)}
                    className={`
                      w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg
                      transition-all duration-200
                      ${avatar === avatarEmoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    {avatarEmoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={generateRandomAvatar}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                🎲 Random Avatar
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Planning Poker</h1>
          <p className="text-gray-600">Collaborative estimation for agile teams</p>
          
          {/* User info */}
          <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-white rounded-lg shadow-sm inline-flex">
            <span className="text-2xl">{avatar}</span>
            <span className="font-medium text-gray-700">{name}</span>
            <button
              onClick={() => setShowNameForm(true)}
              className="text-blue-600 hover:text-blue-700 text-sm ml-2"
            >
              Change
            </button>
          </div>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6 text-center">
            <span className="text-yellow-800">Connecting to server...</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-4 mb-6 text-center">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Session */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Session</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name
                </label>
                <input
                  id="sessionName"
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Sprint 12 Planning"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim() || !isConnected || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors duration-200"
              >
                {isLoading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>

          {/* Join Session */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Session</h2>
            
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span>No active sessions found</span>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{session.name}</h3>
                        <p className="text-sm text-gray-600">
                          {session.userCount} participant{session.userCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        disabled={!isConnected || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Maximum 3 concurrent sessions • 16 participants per session</p>
        </div>
      </div>
    </div>
  );
};