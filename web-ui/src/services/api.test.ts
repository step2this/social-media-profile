import { apiService } from './api';

// Mock fetch globally
global.fetch = jest.fn();

const mockApiUrl = 'https://test-api.example.com/prod';

// Mock ServiceConfig
jest.mock('@/shared/config', () => ({
  ServiceConfig: {
    getApiUrl: () => mockApiUrl,
  },
}));

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    test('makes POST request with correct data', async () => {
      const mockProfile = {
        userId: 'test-123',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockProfile),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.createProfile({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        bio: 'Test bio',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/profiles`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );

      expect(result).toEqual(mockProfile);
    });

    test('throws error on failed request', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid data' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(apiService.createProfile({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        bio: 'Test bio',
      })).rejects.toThrow('Invalid data');
    });
  });

  describe('getProfile', () => {
    test('makes GET request to correct endpoint', async () => {
      const mockProfile = {
        userId: 'test-123',
        username: 'testuser',
        displayName: 'Test User',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockProfile),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiService.getProfile('test-123');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/profiles/test-123`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('updateProfile', () => {
    test('makes PUT request with correct data', async () => {
      const mockUpdatedProfile = {
        userId: 'test-123',
        username: 'testuser',
        displayName: 'Updated User',
        bio: 'Updated bio',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockUpdatedProfile),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.updateProfile('test-123', {
        displayName: 'Updated User',
        bio: 'Updated bio',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/profiles/test-123`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );

      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe('social operations', () => {
    test('follow user makes correct request', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiService.followUser('user-123', 'user-456');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/social/follow`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            followerId: 'user-123',
            followedUserId: 'user-456',
          }),
        })
      );
    });

    test('unfollow user makes correct request', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiService.unfollowUser('user-123', 'user-456');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/social/unfollow`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            followerId: 'user-123',
            followedUserId: 'user-456',
          }),
        })
      );
    });

    test('check follow status makes correct request', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ isFollowing: true }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiService.checkFollowStatus('user-123', 'user-456');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/social/check-follow/user-123/user-456`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('posts', () => {
    test('create post makes correct request', async () => {
      const mockPost = {
        postId: 'post-123',
        userId: 'user-123',
        content: 'Test post content',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockPost),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.createPost('user-123', {
        content: 'Test post content',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/posts`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-123',
            content: 'Test post content',
          }),
        })
      );

      expect(result.postId).toBe('post-123');
    });

    test('get user posts makes correct request', async () => {
      const mockPosts = {
        posts: [
          { postId: 'post-1', content: 'Post 1' },
          { postId: 'post-2', content: 'Post 2' },
        ],
        userId: 'user-123',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockPosts),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiService.getUserPosts('user-123');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/posts/user/user-123`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('get user feed makes correct request', async () => {
      const mockFeed = {
        feedItems: [
          { postId: 'post-1', content: 'Post 1', authorId: 'user-456' },
        ],
        userId: 'user-123',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockFeed),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.getUserFeed('user-123');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/feed/user-123`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.feedItems).toHaveLength(1);
      expect(result.userId).toBe('user-123');
    });
  });

  describe('discovery', () => {
    test('get discovery content makes correct request', async () => {
      const mockContent = {
        users: [],
        posts: [],
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockContent),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiService.getDiscoveryContent();

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/discovery`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});