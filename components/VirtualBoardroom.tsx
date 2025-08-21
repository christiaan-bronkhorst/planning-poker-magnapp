'use client';

import { Session, VotingRound } from '@/lib/types/session';
import { SessionUser } from '@/lib/types/user';
import UserStatus from './UserStatus';

interface VirtualBoardroomProps {
  session: Session;
  currentUserId: string;
  votingRound: VotingRound | null;
  votingStatus: Map<string, boolean>;
  isScrumMaster: boolean;
  onKickUser: (userId: string) => void;
  onTransferScrumMaster: (userId: string) => void;
}

interface UserPosition {
  user: SessionUser;
  x: number;
  y: number;
  angle: number;
}

export default function VirtualBoardroom({
  session,
  currentUserId,
  votingRound,
  votingStatus,
  isScrumMaster,
  onKickUser,
  onTransferScrumMaster,
}: VirtualBoardroomProps) {
  const calculateUserPositions = (): UserPosition[] => {
    const users = Array.from(session.users.values());
    const positions: UserPosition[] = [];
    const totalUsers = users.length;
    
    // Oval table dimensions (relative to container)
    const centerX = 50; // percentage
    const centerY = 50; // percentage
    const radiusX = 40; // percentage (wider)
    const radiusY = 30; // percentage (shorter for oval effect)
    
    users.forEach((user, index) => {
      // Distribute users evenly around the oval
      const angle = (index / totalUsers) * 2 * Math.PI - Math.PI / 2; // Start from top
      
      // Calculate position on oval
      const x = centerX + radiusX * Math.cos(angle);
      const y = centerY + radiusY * Math.sin(angle);
      
      positions.push({
        user,
        x,
        y,
        angle: angle * (180 / Math.PI) + 90, // Convert to degrees for rotation
      });
    });
    
    return positions;
  };

  const userPositions = calculateUserPositions();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Virtual Boardroom - {session.name}
      </h3>

      {/* Boardroom Visualization */}
      <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
        {/* Oval Table */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-4/5 h-3/5">
            {/* Table Surface */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full shadow-2xl" />
            
            {/* Table Inner Border */}
            <div className="absolute inset-2 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full" />
            
            {/* Table Center */}
            <div className="absolute inset-4 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-white/80 text-sm font-semibold">
                  {votingRound && !votingRound.isRevealed ? 'Voting in Progress' :
                   votingRound && votingRound.isRevealed ? 'Votes Revealed' :
                   'Waiting to Start'}
                </p>
                {votingRound && !votingRound.isRevealed && (
                  <p className="text-white/60 text-xs mt-1">
                    {Array.from(votingStatus.values()).filter(v => v).length}/{session.users.size} voted
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Positions */}
        {userPositions.map(({ user, x, y }) => (
          <div
            key={user.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
          >
            <UserStatus
              user={user}
              hasVoted={votingStatus.get(user.id) || false}
              vote={votingRound?.votes.get(user.id)?.value}
              isRevealed={votingRound?.isRevealed || false}
              isCurrentUser={user.id === currentUserId}
              onKick={isScrumMaster && user.id !== currentUserId ? () => onKickUser(user.id) : undefined}
              onTransferRole={isScrumMaster && user.id !== currentUserId ? () => onTransferScrumMaster(user.id) : undefined}
              showControls={isScrumMaster}
            />
          </div>
        ))}

        {/* Room Decorations */}
        <div className="absolute top-2 left-2">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow">
            <p className="text-xs text-gray-600">
              {session.users.size} participant{session.users.size !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Session Status */}
        {session.isPaused && (
          <div className="absolute top-2 right-2">
            <div className="bg-yellow-500/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow animate-pulse">
              <p className="text-xs text-white font-medium">
                Session Paused
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View - List Layout */}
      <div className="md:hidden mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Participants:</h4>
        <div className="grid grid-cols-2 gap-3">
          {Array.from(session.users.values()).map((user) => (
            <div key={user.id} className="bg-gray-50 rounded-lg p-2">
              <UserStatus
                user={user}
                hasVoted={votingStatus.get(user.id) || false}
                vote={votingRound?.votes.get(user.id)?.value}
                isRevealed={votingRound?.isRevealed || false}
                isCurrentUser={user.id === currentUserId}
                onKick={isScrumMaster && user.id !== currentUserId ? () => onKickUser(user.id) : undefined}
                onTransferRole={isScrumMaster && user.id !== currentUserId ? () => onTransferScrumMaster(user.id) : undefined}
                showControls={isScrumMaster}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}