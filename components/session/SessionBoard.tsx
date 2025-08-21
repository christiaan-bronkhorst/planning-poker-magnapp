'use client';

import { useEffect, useState, useRef } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useSessionStore } from '@/lib/store/sessionStore';
import { useUserStore } from '@/lib/store/userStore';
import { 
  calculateBoardroomDimensions, 
  calculateUserPositions, 
  getTableDimensions,
  getResponsiveAvatarSize 
} from '@/lib/utils/positioning';

interface SessionBoardProps {
  onKickUser?: (userId: string) => void;
  onTransferRole?: (userId: string) => void;
  showControls?: boolean;
}

export const SessionBoard = ({ 
  onKickUser, 
  onTransferRole, 
  showControls = false 
}: SessionBoardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { currentSession } = useSessionStore();
  const { id: currentUserId } = useUserStore();

  const users = currentSession ? Array.from(currentSession.users.values()) : [];
  const currentUser = users.find(u => u.id === currentUserId);
  const isCurrentUserScrumMaster = currentUser?.isScrumMaster || false;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!currentSession || users.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">No participants in session</p>
        </div>
      </div>
    );
  }

  const boardroomDims = calculateBoardroomDimensions(dimensions.width, dimensions.height);
  const userPositions = calculateUserPositions(users.length, boardroomDims);
  const tableDims = getTableDimensions(boardroomDims);
  const avatarSize = getResponsiveAvatarSize(dimensions.width);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg overflow-hidden">
      {/* Conference table */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <defs>
          <linearGradient id="tableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#A0522D" />
          </linearGradient>
          <filter id="tableShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="3" stdDeviation="8" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        <ellipse
          cx={tableDims.cx}
          cy={tableDims.cy}
          rx={tableDims.rx}
          ry={tableDims.ry}
          fill="url(#tableGradient)"
          filter="url(#tableShadow)"
        />
      </svg>

      {/* Session info overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
        <h3 className="font-medium text-gray-800">{currentSession.name}</h3>
        <p className="text-sm text-gray-600">{users.length} participant{users.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-700">Connected</span>
        </div>
      </div>

      {/* User avatars positioned around the table */}
      {users.map((user, index) => {
        const position = userPositions[index];
        if (!position) return null;

        const isCurrentUser = user.id === currentUserId;
        const showVoteStatus = currentSession.currentRound && !currentSession.currentRound.isRevealed;

        return (
          <div
            key={user.id}
            className="absolute"
            style={{
              left: position.x - avatarSize / 2,
              top: position.y - avatarSize / 2,
              transform: `translate(-50%, -50%)`,
            }}
          >
            <UserAvatar
              user={user}
              size={avatarSize}
              showVoteStatus={showVoteStatus}
              showConnectionStatus={true}
              className={`
                transition-all duration-300
                ${isCurrentUser ? 'ring-4 ring-blue-400' : ''}
              `}
            />

            {/* User controls for Scrum Master */}
            {showControls && isCurrentUserScrumMaster && !isCurrentUser && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex gap-1 bg-white rounded-md shadow-lg px-2 py-1">
                  <button
                    onClick={() => onTransferRole?.(user.id)}
                    className="text-xs px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                    title="Make Scrum Master"
                  >
                    👑
                  </button>
                  <button
                    onClick={() => onKickUser?.(user.id)}
                    className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    title="Remove from session"
                  >
                    ❌
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Center logo/branding */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center opacity-20">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-lg font-bold text-gray-600">Planning Poker</div>
        </div>
      </div>

      {/* Voting status indicator */}
      {currentSession.currentRound && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            {currentSession.currentRound.isRevealed ? (
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm font-medium text-gray-700">Votes Revealed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Voting in Progress</span>
                <span className="text-xs text-gray-600">
                  ({users.filter(u => u.hasVoted).length}/{users.length})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session paused indicator */}
      {currentSession.isPaused && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 text-center max-w-sm">
            <div className="text-4xl mb-4">⏸️</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Session Paused</h3>
            <p className="text-gray-600">Waiting for Scrum Master to return...</p>
          </div>
        </div>
      )}
    </div>
  );
};