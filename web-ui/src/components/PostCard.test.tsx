import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostCard } from './PostCard';
import { Post, FeedItem } from '@/types/profile';

describe('PostCard', () => {
  const mockPost: Post = {
    PK: 'POST#post-123',
    SK: 'METADATA',
    postId: 'post-123',
    userId: 'user-456',
    username: 'johndoe',
    displayName: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    content: 'This is a test post content',
    likesCount: 5,
    commentsCount: 2,
    createdAt: '2024-01-01T12:00:00Z',
  };

  const mockFeedItem: FeedItem = {
    PK: 'FEED#user-123',
    SK: 'POST#1704110400000#post-123',
    postId: 'post-123',
    authorId: 'user-456',
    authorUsername: 'johndoe',
    authorDisplayName: 'John Doe',
    authorAvatar: 'https://example.com/avatar.jpg',
    content: 'This is a test feed item content',
    likesCount: 10,
    commentsCount: 3,
    createdAt: '2024-01-01T12:00:00Z',
  };

  test('renders post with all required information', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // likes count
    expect(screen.getByText('2')).toBeInTheDocument(); // comments count
  });

  test('renders feed item with correct author information', () => {
    render(<PostCard post={mockFeedItem} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
    expect(screen.getByText('This is a test feed item content')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // likes count
    expect(screen.getByText('3')).toBeInTheDocument(); // comments count
  });

  test('displays author avatar when provided', () => {
    render(<PostCard post={mockPost} />);

    const avatar = screen.getByAltText("John Doe's avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  test('displays default avatar when no avatar provided', () => {
    const postWithoutAvatar = { ...mockPost, avatar: '' };
    render(<PostCard post={postWithoutAvatar} />);

    // Should show default user icon instead of image
    expect(screen.queryByAltText("John Doe's avatar")).not.toBeInTheDocument();
    // User icon should be present
    expect(document.querySelector('.lucide-user')).toBeInTheDocument();
  });

  test('displays post image when imageUrl is provided', () => {
    const postWithImage = { ...mockPost, imageUrl: 'https://example.com/post-image.jpg' };
    render(<PostCard post={postWithImage} />);

    const postImage = screen.getByAltText('Post image');
    expect(postImage).toBeInTheDocument();
    expect(postImage).toHaveAttribute('src', 'https://example.com/post-image.jpg');
  });

  test('does not display post image when imageUrl is not provided', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.queryByAltText('Post image')).not.toBeInTheDocument();
  });

  test('formats time correctly for recent posts', () => {
    // Mock the entire Date constructor
    const realDate = Date;
    const mockDate = jest.fn((dateString?: string | number) => {
      if (dateString) {
        return new realDate(dateString);
      }
      return new realDate('2024-01-01T12:30:00Z'); // Fixed "now" time
    });
    (mockDate as any).now = jest.fn(() => new realDate('2024-01-01T12:30:00Z').getTime());
    (global as any).Date = mockDate;

    // Post created 30 minutes ago
    const recentPost = { ...mockPost, createdAt: '2024-01-01T12:00:00Z' };
    render(<PostCard post={recentPost} />);

    expect(screen.getByText('30m ago')).toBeInTheDocument();

    // Restore original Date
    global.Date = realDate;
  });

  test('formats time correctly for older posts', () => {
    // Mock the entire Date constructor
    const realDate = Date;
    const mockDate = jest.fn((dateString?: string | number) => {
      if (dateString) {
        return new realDate(dateString);
      }
      return new realDate('2024-01-02T12:00:00Z'); // Fixed "now" time (1 day later)
    });
    (mockDate as any).now = jest.fn(() => new realDate('2024-01-02T12:00:00Z').getTime());
    (global as any).Date = mockDate;

    // Post created 1 day ago
    const oldPost = { ...mockPost, createdAt: '2024-01-01T12:00:00Z' };
    render(<PostCard post={oldPost} />);

    expect(screen.getByText('1d ago')).toBeInTheDocument();

    // Restore original Date
    global.Date = realDate;
  });

  test('calls onClick handler when card is clicked', () => {
    const mockOnClick = jest.fn();
    render(<PostCard post={mockPost} onClick={mockOnClick} />);

    const card = screen.getByText('This is a test post content').closest('.cursor-pointer');
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when no handler provided', () => {
    // Should not throw error when clicked without onClick handler
    render(<PostCard post={mockPost} />);

    const card = screen.getByText('This is a test post content').closest('div');
    expect(() => fireEvent.click(card!)).not.toThrow();
  });

  test('like button is interactive', () => {
    render(<PostCard post={mockPost} />);

    const likeButton = screen.getByRole('button', { name: /5/ });
    expect(likeButton).toBeInTheDocument();

    fireEvent.click(likeButton);
    // Note: Since we don't have like functionality implemented yet,
    // we just test that the button is clickable
  });

  test('comment button is interactive', () => {
    render(<PostCard post={mockPost} />);

    const commentButton = screen.getByRole('button', { name: /2/ });
    expect(commentButton).toBeInTheDocument();

    fireEvent.click(commentButton);
    // Note: Since we don't have comment functionality implemented yet,
    // we just test that the button is clickable
  });

  test('share button is interactive', () => {
    render(<PostCard post={mockPost} />);

    const shareButtons = screen.getAllByRole('button');
    const shareButton = shareButtons.find(button =>
      button.querySelector('.lucide-share')
    );

    expect(shareButton).toBeInTheDocument();
    fireEvent.click(shareButton!);
  });

  test('handles very long content gracefully', () => {
    const longContent = 'A'.repeat(1000);
    const postWithLongContent = { ...mockPost, content: longContent };

    render(<PostCard post={postWithLongContent} />);

    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  test('handles posts with zero engagement', () => {
    const postWithNoEngagement = {
      ...mockPost,
      likesCount: 0,
      commentsCount: 0,
    };

    render(<PostCard post={postWithNoEngagement} />);

    const zeroTexts = screen.getAllByText('0');
    expect(zeroTexts).toHaveLength(2); // likes and comments both show 0
  });
});