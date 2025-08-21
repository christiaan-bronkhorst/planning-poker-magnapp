'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import { UserSetup } from '@/components/UserSetup';
import { SessionList } from '@/components/SessionList';
import { CreateSessionModal } from '@/components/CreateSessionModal';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getAvatarById } from '@/lib/constants/avatars';

export function HomePage() {
  const router = useRouter();
  const { user, isLoading, hasSetup, updateUser } = useUser();
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasSetup) {
      setShowUserSetup(true);
    }
  }, [isLoading, hasSetup]);

  const handleUserSetup = async (name: string, avatar: string) => {
    await updateUser(name, avatar);
    setShowUserSetup(false);
  };

  const handleCreateSession = async (name: string) => {
    if (!user) {
      setShowUserSetup(true);
      return;
    }

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create session');
    }

    const { session } = await response.json();
    router.push(`/session/${session.id}`);
  };

  const handleJoinSession = (sessionId: string) => {
    if (!user) {
      setShowUserSetup(true);
      return;
    }
    router.push(`/session/${sessionId}`);
  };

  const handleEditProfile = () => {
    setShowUserSetup(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const avatarData = user ? getAvatarById(user.avatar) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                MagnaPP Planning Poker
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Collaborate with your team to estimate work efficiently
              </p>
            </div>
            
            {user && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEditProfile}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-2xl" role="img" aria-label={avatarData?.name}>
                    {avatarData?.emoji}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Active Sessions
            </h2>
            <Button
              variant="primary"
              onClick={() => setShowCreateSession(true)}
            >
              Create New Session
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <SessionList onJoinSession={handleJoinSession} />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Sessions are automatically cleaned up after 10 minutes of inactivity</p>
          <p className="mt-1">Maximum 3 concurrent sessions • Up to 16 users per session</p>
        </div>
      </div>

      <UserSetup
        isOpen={showUserSetup}
        onComplete={handleUserSetup}
        initialName={user?.name}
        initialAvatar={user?.avatar}
      />

      <CreateSessionModal
        isOpen={showCreateSession}
        onClose={() => setShowCreateSession(false)}
        onCreate={handleCreateSession}
      />
    </div>
  );
}