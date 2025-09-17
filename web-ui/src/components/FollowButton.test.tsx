import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FollowButton } from './FollowButton';
import { apiService } from '@/services/api';

// Mock the API service
jest.mock('@/services/api', () => ({
  apiService: {
    checkFollowStatus: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('FollowButton', () => {
  const mockProps = {
    currentUserId: 'user-123',
    targetUserId: 'user-456',
    onFollowChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders follow button when not following', async () => {
    mockApiService.checkFollowStatus.mockResolvedValue({
      isFollowing: false,
      followerId: 'user-123',
      followedUserId: 'user-456',
    });

    render(<FollowButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    expect(screen.getByRole('button')).toHaveTextContent('Follow');
  });

  test('renders unfollow button when following', async () => {
    mockApiService.checkFollowStatus.mockResolvedValue({
      isFollowing: true,
      followerId: 'user-123',
      followedUserId: 'user-456',
    });

    render(<FollowButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Unfollow')).toBeInTheDocument();
    });

    expect(screen.getByRole('button')).toHaveTextContent('Unfollow');
  });

  test('handles follow action', async () => {
    mockApiService.checkFollowStatus.mockResolvedValue({
      isFollowing: false,
      followerId: 'user-123',
      followedUserId: 'user-456',
    });

    mockApiService.followUser.mockResolvedValue({
      message: 'Successfully followed user',
      followerId: 'user-123',
      followedUserId: 'user-456',
      createdAt: '2024-01-01T00:00:00Z',
    });

    render(<FollowButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button'));

    expect(mockApiService.followUser).toHaveBeenCalledWith('user-123', 'user-456');

    await waitFor(() => {
      expect(screen.getByText('Unfollow')).toBeInTheDocument();
    });

    expect(mockProps.onFollowChange).toHaveBeenCalled();
  });

  test('handles unfollow action', async () => {
    mockApiService.checkFollowStatus.mockResolvedValue({
      isFollowing: true,
      followerId: 'user-123',
      followedUserId: 'user-456',
    });

    mockApiService.unfollowUser.mockResolvedValue({
      message: 'Successfully unfollowed user',
      followerId: 'user-123',
      followedUserId: 'user-456',
      timestamp: '2024-01-01T00:00:00Z',
    });

    render(<FollowButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Unfollow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button'));

    expect(mockApiService.unfollowUser).toHaveBeenCalledWith('user-123', 'user-456');

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    expect(mockProps.onFollowChange).toHaveBeenCalled();
  });

  test('shows loading state during follow action', async () => {
    mockApiService.checkFollowStatus.mockResolvedValue({
      isFollowing: false,
      followerId: 'user-123',
      followedUserId: 'user-456',
    });

    // Mock a delayed response
    mockApiService.followUser.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        message: 'Successfully followed user',
        followerId: 'user-123',
        followedUserId: 'user-456',
        createdAt: '2024-01-01T00:00:00Z',
      }), 100))
    );

    render(<FollowButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('handles API errors gracefully', async () => {
    mockApiService.checkFollowStatus.mockResolvedValue({
      isFollowing: false,
      followerId: 'user-123',
      followedUserId: 'user-456',
    });

    mockApiService.followUser.mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<FollowButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error toggling follow:', expect.any(Error));
    });

    // Button should still show 'Follow' after error
    expect(screen.getByText('Follow')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test('does not render when currentUserId equals targetUserId', async () => {
    const sameUserProps = {
      currentUserId: 'user-123',
      targetUserId: 'user-123',
      onFollowChange: jest.fn(),
    };

    const { container } = render(<FollowButton {...sameUserProps} />);

    expect(container.firstChild).toBeNull();
    expect(mockApiService.checkFollowStatus).not.toHaveBeenCalled();
  });

  test('does not render when currentUserId is empty', async () => {
    const emptyUserProps = {
      currentUserId: '',
      targetUserId: 'user-456',
      onFollowChange: jest.fn(),
    };

    const { container } = render(<FollowButton {...emptyUserProps} />);

    expect(container.firstChild).toBeNull();
    expect(mockApiService.checkFollowStatus).not.toHaveBeenCalled();
  });
});