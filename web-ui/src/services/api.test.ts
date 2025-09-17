import { apiService } from './api';

// Mock fetch globally
global.fetch = jest.fn();

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
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/profiles',
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

      const result = await apiService.getProfile('test-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/profiles/test-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    test('makes PUT request with correct data', async () => {
      const mockUpdatedProfile = {
        userId: 'test-123',
        username: 'testuser',
        displayName: 'Updated Test User',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockUpdatedProfile),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.updateProfile('test-123', {
        displayName: 'Updated Test User',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/profiles/test-123',
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

  describe('Social Features', () => {
    describe('followUser', () => {
      test('makes POST request to follow endpoint', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            message: 'Successfully followed user',
            followerId: 'user-123',
            followedUserId: 'user-456',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        };

        (fetch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await apiService.followUser('user-123', 'user-456');

        expect(fetch).toHaveBeenCalledWith(
          'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/social/follow',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              followerId: 'user-123',
              followedUserId: 'user-456',
            }),
          })
        );

        expect(result.message).toBe('Successfully followed user');
      });
    });

    describe('unfollowUser', () => {
      test('makes POST request to unfollow endpoint', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            message: 'Successfully unfollowed user',
            followerId: 'user-123',
            followedUserId: 'user-456',
            timestamp: '2024-01-01T00:00:00Z',
          }),
        };

        (fetch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await apiService.unfollowUser('user-123', 'user-456');

        expect(fetch).toHaveBeenCalledWith(
          'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/social/unfollow',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              followerId: 'user-123',
              followedUserId: 'user-456',
            }),
          })
        );

        expect(result.message).toBe('Successfully unfollowed user');
      });
    });

    describe('checkFollowStatus', () => {
      test('makes GET request to check follow status', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            isFollowing: true,
            followerId: 'user-123',
            followedUserId: 'user-456',
          }),
        };

        (fetch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await apiService.checkFollowStatus('user-123', 'user-456');

        expect(fetch).toHaveBeenCalledWith(
          'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/social/check-follow/user-123/user-456',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );

        expect(result.isFollowing).toBe(true);
      });
    });

    describe('createPost', () => {
      test('makes POST request to create post', async () => {
        const mockPost = {
          PK: 'POST#post-123',
          SK: 'METADATA',
          postId: 'post-123',
          userId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          avatar: '',
          content: 'Test post content',
          likesCount: 0,
          commentsCount: 0,
          createdAt: '2024-01-01T00:00:00Z',
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
          'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/posts',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userId: 'user-123',
              content: 'Test post content',
            }),
          })
        );

        expect(result.content).toBe('Test post content');
      });
    });

    describe('getUserPosts', () => {
      test('makes GET request to fetch user posts', async () => {
        const mockPosts = [
          {
            PK: 'POST#post-123',
            SK: 'METADATA',
            postId: 'post-123',
            userId: 'user-123',
            content: 'Post 1',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ];

        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            posts: mockPosts,
            userId: 'user-123',
          }),
        };

        (fetch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await apiService.getUserPosts('user-123');

        expect(fetch).toHaveBeenCalledWith(
          'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/posts/user/user-123',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );

        expect(result.posts).toHaveLength(1);
        expect(result.userId).toBe('user-123');
      });
    });

    describe('getUserFeed', () => {
      test('makes GET request to fetch user feed', async () => {
        const mockFeedItems = [
          {
            PK: 'FEED#user-123',
            SK: 'POST#1704110400000#post-456',
            postId: 'post-456',
            authorId: 'user-456',
            authorUsername: 'johndoe',
            content: 'Feed item content',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ];

        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            feedItems: mockFeedItems,
            userId: 'user-123',
          }),
        };

        (fetch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await apiService.getUserFeed('user-123');

        expect(fetch).toHaveBeenCalledWith(
          'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/feed/user-123',
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
  });

  describe('Error handling', () => {
    test('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(apiService.getProfile('test-123')).rejects.toThrow('Network error');
    });

    test('handles response parsing errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiService.getProfile('test-123')).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    test('handles social feature errors', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: () => Promise.resolve({ error: 'Already following this user' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(apiService.followUser('user-123', 'user-456')).rejects.toThrow('Already following this user');
    });
  });
});