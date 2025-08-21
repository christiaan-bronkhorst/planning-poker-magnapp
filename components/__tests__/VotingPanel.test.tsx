import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VotingPanel from '../VotingPanel';
import { VoteValue } from '@/lib/types/vote';

describe('VotingPanel', () => {
  const mockSubmitVote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders voting panel with waiting state', () => {
    render(
      <VotingPanel
        isVotingActive={false}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    expect(screen.getByText('Waiting for voting to start...')).toBeInTheDocument();
  });

  it('renders voting panel with active voting', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    expect(screen.getByText('Select Your Estimate')).toBeInTheDocument();
    expect(screen.getByText('Click a card to select')).toBeInTheDocument();
  });

  it('displays all Fibonacci cards', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    // Check for numeric cards
    ['1', '2', '3', '5', '8', '13', '21'].forEach(value => {
      const cards = screen.getAllByText(value);
      expect(cards.length).toBeGreaterThan(0);
    });

    // Check for coffee card
    expect(screen.getByText('☕')).toBeInTheDocument();
  });

  it('allows card selection when voting is active', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const card5 = screen.getAllByText('5')[0].closest('button');
    fireEvent.click(card5!);

    // Card should be selected (has different styling)
    expect(card5).toHaveClass('bg-blue-500');
  });

  it('deselects card when clicked again', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const card5 = screen.getAllByText('5')[0].closest('button');
    
    // Select
    fireEvent.click(card5!);
    expect(card5).toHaveClass('bg-blue-500');
    
    // Deselect
    fireEvent.click(card5!);
    expect(card5).not.toHaveClass('bg-blue-500');
  });

  it('submits vote when submit button is clicked', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const card8 = screen.getAllByText('8')[0].closest('button');
    fireEvent.click(card8!);

    const submitButton = screen.getByText('Submit Vote');
    fireEvent.click(submitButton);

    expect(mockSubmitVote).toHaveBeenCalledWith(8);
  });

  it('disables submit button when no card selected', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const submitButton = screen.getByText('Submit Vote');
    expect(submitButton).toBeDisabled();
  });

  it('shows vote submitted state', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={true}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
        currentVote={5 as VoteValue}
      />
    );

    expect(screen.getByText('Vote Submitted')).toBeInTheDocument();
    expect(screen.getByText('✓ Your vote has been submitted')).toBeInTheDocument();
    expect(screen.getByText('Waiting for others to vote...')).toBeInTheDocument();
  });

  it('shows votes revealed state', () => {
    render(
      <VotingPanel
        isVotingActive={false}
        hasVoted={true}
        isRevealed={true}
        onSubmitVote={mockSubmitVote}
      />
    );

    expect(screen.getByText('Votes have been revealed')).toBeInTheDocument();
  });

  it('disables card selection when voting is not active', () => {
    render(
      <VotingPanel
        isVotingActive={false}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const card5 = screen.getAllByText('5')[0].closest('button');
    expect(card5).toBeDisabled();
  });

  it('disables card selection when already voted', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={true}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const card5 = screen.getAllByText('5')[0].closest('button');
    expect(card5).toBeDisabled();
  });

  it('shows voting guide when voting is active', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    expect(screen.getByText('Fibonacci Sequence Guide:')).toBeInTheDocument();
    expect(screen.getByText(/Simple tasks, minimal effort/)).toBeInTheDocument();
    expect(screen.getByText(/Moderate complexity, standard effort/)).toBeInTheDocument();
    expect(screen.getByText(/Complex tasks, significant effort/)).toBeInTheDocument();
    expect(screen.getByText(/Need a break or more information/)).toBeInTheDocument();
  });

  it('highlights coffee card with different style', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const coffeeCard = screen.getByText('☕').closest('button');
    fireEvent.click(coffeeCard!);
    
    expect(coffeeCard).toHaveClass('bg-blue-500');
  });

  it('submits coffee vote correctly', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={false}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
      />
    );

    const coffeeCard = screen.getByText('☕').closest('button');
    fireEvent.click(coffeeCard!);

    const submitButton = screen.getByText('Submit Vote');
    fireEvent.click(submitButton);

    expect(mockSubmitVote).toHaveBeenCalledWith('coffee');
  });

  it('highlights the submitted vote card', () => {
    render(
      <VotingPanel
        isVotingActive={true}
        hasVoted={true}
        isRevealed={false}
        onSubmitVote={mockSubmitVote}
        currentVote={13 as VoteValue}
      />
    );

    const card13 = screen.getAllByText('13')[0].closest('button');
    expect(card13).toHaveClass('bg-green-500');
  });
});