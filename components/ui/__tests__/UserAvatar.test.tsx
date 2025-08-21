import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../UserAvatar';
import { SessionUser } from '@/lib/types/user';

const mockUser: SessionUser = {
  id: 'user-1',
  name: 'John Doe',
  avatar: '🦊',
  isConnected: true,
  hasVoted: false,
  isScrumMaster: false,
  joinedAt: new Date(),
  connectionId: 'conn-1',
};

describe('UserAvatar', () => {
  it('renders user avatar and name', () => {
    render(<UserAvatar user={mockUser} />);
    
    expect(screen.getByText('🦊')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows Scrum Master crown when user is Scrum Master', () => {
    const scrumMasterUser = { ...mockUser, isScrumMaster: true };
    render(<UserAvatar user={scrumMasterUser} />);
    
    expect(screen.getByText('👑')).toBeInTheDocument();
  });

  it('shows green ring when user has voted', () => {
    const votedUser = { ...mockUser, hasVoted: true };
    const { container } = render(<UserAvatar user={votedUser} showVoteStatus={true} />);
    
    const avatarContainer = container.querySelector('.ring-green-500');
    expect(avatarContainer).toBeInTheDocument();
  });

  it('shows red ring when user has not voted', () => {
    const { container } = render(<UserAvatar user={mockUser} showVoteStatus={true} />);
    
    const avatarContainer = container.querySelector('.ring-red-500');
    expect(avatarContainer).toBeInTheDocument();
  });

  it('shows connection status', () => {
    render(<UserAvatar user={mockUser} showConnectionStatus={true} />);
    
    // Should show green indicator for connected user
    const { container } = render(<UserAvatar user={mockUser} showConnectionStatus={true} />);
    const connectionIndicator = container.querySelector('.bg-green-400');
    expect(connectionIndicator).toBeInTheDocument();
  });

  it('shows disconnected status for offline user', () => {
    const disconnectedUser = { ...mockUser, isConnected: false };
    const { container } = render(<UserAvatar user={disconnectedUser} showConnectionStatus={true} />);
    
    const connectionIndicator = container.querySelector('.bg-gray-400');
    expect(connectionIndicator).toBeInTheDocument();
  });
});