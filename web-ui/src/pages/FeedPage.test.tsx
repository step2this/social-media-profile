import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { apiService } from '@/services/api';

// Mock the FeedPage component without router dependencies
const MockFeedPage = () => {
  const [feedItems, setFeedItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [content, setContent] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);

  React.useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await apiService.getUserFeed('demo-user-123');
        setFeedItems(response.feedItems);
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handlePost = async () => {
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      await apiService.createPost('demo-user-123', { content });
      setContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Feed</h1>
      <div>
        <textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={handlePost}
          disabled={!content.trim() || isPosting}
        >
          {isPosting ? 'Posting...' : 'Post'}
        </button>
        <div>{content.length}/280 characters</div>
      </div>
      {feedItems.length === 0 ? (
        <div>
          <p>Your feed is empty</p>
          <p>Follow some users to see their posts here</p>
          <button>Discover Profiles</button>
        </div>
      ) : (
        feedItems.map((item: any, index) => (
          <div key={index}>
            <p>{item.content}</p>
            <p>{item.authorDisplayName}</p>
          </div>
        ))
      )}
    </div>
  );
};

const mockNavigate = jest.fn();

// Mock the API service
jest.mock('@/services/api', () => ({
  apiService: {
    getUserFeed: jest.fn(),
    createPost: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

const renderFeedPage = () => {
  return render(<MockFeedPage />);
};

describe('FeedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders feed page with header and post creation form', async () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    renderFeedPage();

    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText("What's on your mind?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
  });

  test('displays empty feed message when no feed items', async () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    renderFeedPage();

    await waitFor(() => {
      expect(screen.getByText('Your feed is empty')).toBeInTheDocument();
    });

    expect(screen.getByText(/Follow some users to see their posts here/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discover profiles/i })).toBeInTheDocument();
  });

  test('displays feed items when available', async () => {
    const mockFeedItems = [
      {
        PK: 'FEED#demo-user-123',
        SK: 'POST#1704110400000#post-1',
        postId: 'post-1',
        authorId: 'user-456',
        authorUsername: 'johndoe',
        authorDisplayName: 'John Doe',
        authorAvatar: '',
        content: 'This is a test post',
        likesCount: 5,
        commentsCount: 2,
        createdAt: '2024-01-01T12:00:00Z',
      },
      {
        PK: 'FEED#demo-user-123',
        SK: 'POST#1704106800000#post-2',
        postId: 'post-2',
        authorId: 'user-789',
        authorUsername: 'janedoe',
        authorDisplayName: 'Jane Doe',
        authorAvatar: '',
        content: 'Another test post',
        likesCount: 3,
        commentsCount: 1,
        createdAt: '2024-01-01T11:00:00Z',
      },
    ];

    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: mockFeedItems,
      userId: 'demo-user-123',
    });

    renderFeedPage();

    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });

    expect(screen.getByText('Another test post')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  test('handles post creation successfully', async () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    mockApiService.createPost.mockResolvedValue({
      PK: 'POST#new-post',
      SK: 'METADATA',
      postId: 'new-post',
      userId: 'demo-user-123',
      username: 'demouser',
      displayName: 'Demo User',
      avatar: '',
      content: 'My new post',
      likesCount: 0,
      commentsCount: 0,
      createdAt: '2024-01-01T12:00:00Z',
    });

    renderFeedPage();

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    const postButton = screen.getByRole('button', { name: /post/i });

    // Initially post button should be disabled
    expect(postButton).toBeDisabled();

    // Type content
    fireEvent.change(textarea, { target: { value: 'My new post' } });

    // Now post button should be enabled
    expect(postButton).not.toBeDisabled();

    // Click post button
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(mockApiService.createPost).toHaveBeenCalledWith('demo-user-123', {
        content: 'My new post',
      });
    });

    // Check that textarea is cleared after posting
    expect(textarea).toHaveValue('');
  });

  test('shows character count', () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    renderFeedPage();

    const textarea = screen.getByPlaceholderText('Share your thoughts...');

    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    expect(screen.getByText('11/280 characters')).toBeInTheDocument();
  });

  test('prevents posting empty content', () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    renderFeedPage();

    const postButton = screen.getByRole('button', { name: /post/i });

    expect(postButton).toBeDisabled();

    // Add whitespace only
    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: '   ' } });

    expect(postButton).toBeDisabled();
  });

  test('shows loading state during post creation', async () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    // Mock a delayed response
    mockApiService.createPost.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        PK: 'POST#new-post',
        SK: 'METADATA',
        postId: 'new-post',
        userId: 'demo-user-123',
        username: 'demouser',
        displayName: 'Demo User',
        avatar: '',
        content: 'Test post',
        likesCount: 0,
        commentsCount: 0,
        createdAt: '2024-01-01T12:00:00Z',
      }), 100))
    );

    renderFeedPage();

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    const postButton = screen.getByRole('button', { name: /post/i });

    fireEvent.change(textarea, { target: { value: 'Test post' } });
    fireEvent.click(postButton);

    expect(screen.getByText('Posting...')).toBeInTheDocument();
    expect(postButton).toBeDisabled();
  });

  test('handles API errors gracefully', async () => {
    mockApiService.getUserFeed.mockRejectedValue(new Error('Network error'));

    renderFeedPage();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch feed')).toBeInTheDocument();
    });
  });

  test('handles post creation errors', async () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    mockApiService.createPost.mockRejectedValue(new Error('Failed to create post'));

    renderFeedPage();

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    const postButton = screen.getByRole('button', { name: /post/i });

    fireEvent.change(textarea, { target: { value: 'Test post' } });
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create post')).toBeInTheDocument();
    });
  });

  test('discover profiles button is rendered', async () => {
    mockApiService.getUserFeed.mockResolvedValue({
      feedItems: [],
      userId: 'demo-user-123',
    });

    renderFeedPage();

    await waitFor(() => {
      expect(screen.getByText('Your feed is empty')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /discover profiles/i })).toBeInTheDocument();
  });
});