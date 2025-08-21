import { render, screen, fireEvent } from '@testing-library/react';
import { VoteCard } from '../VoteCard';

describe('VoteCard', () => {
  it('renders numeric vote value', () => {
    render(<VoteCard value={5} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders coffee emoji for coffee vote', () => {
    render(<VoteCard value="coffee" />);
    
    expect(screen.getByText('☕')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockClick = jest.fn();
    render(<VoteCard value={3} onClick={mockClick} />);
    
    const card = screen.getByText('3');
    fireEvent.click(card);
    
    expect(mockClick).toHaveBeenCalledWith(3);
  });

  it('shows selected state', () => {
    const { container } = render(<VoteCard value={8} isSelected={true} />);
    
    const card = container.querySelector('.bg-blue-600');
    expect(card).toBeInTheDocument();
  });

  it('shows disabled state', () => {
    const mockClick = jest.fn();
    const { container } = render(<VoteCard value={13} isDisabled={true} onClick={mockClick} />);
    
    const card = container.querySelector('button');
    expect(card).toHaveAttribute('disabled');
    
    fireEvent.click(card!);
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('applies hover styles when not disabled', () => {
    const { container } = render(<VoteCard value={21} />);
    
    const card = container.querySelector('.hover\\:border-blue-400');
    expect(card).toBeInTheDocument();
  });

  it('does not apply hover styles when disabled', () => {
    const { container } = render(<VoteCard value={21} isDisabled={true} />);
    
    const card = container.querySelector('.bg-gray-100');
    expect(card).toBeInTheDocument();
  });
});