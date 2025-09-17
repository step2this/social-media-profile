import { adminService, AdminUser, UserListResponse, TestDataResponse, CleanupResponse } from './admin';

// Mock fetch globally
global.fetch = jest.fn();

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    test('makes GET request with pagination parameters', async () => {
      const mockUsers: AdminUser[] = [
        {
          userId: 'user-1',
          username: 'testuser1',
          displayName: 'Test User 1',
          email: 'test1@example.com',
          bio: 'Test bio 1',
          avatar: '',
          followersCount: 5,
          followingCount: 3,
          postsCount: 10,
          isVerified: false,
          isPrivate: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          userId: 'user-2',
          username: 'testuser2',
          displayName: 'Test User 2',
          email: 'test2@example.com',
          bio: 'Test bio 2',
          avatar: '',
          followersCount: 8,
          followingCount: 2,
          postsCount: 15,
          isVerified: false,
          isPrivate: false,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ];

      const mockResponse: UserListResponse = {
        users: mockUsers,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalUsers: 25,
          pageSize: 10,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const result = await adminService.listUsers(1, 10);

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/admin/users?page=1&limit=10',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.users).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalUsers).toBe(25);
      expect(result.users[0].username).toBe('testuser1');
    });

    test('uses default pagination parameters when not provided', async () => {
      const mockResponse: UserListResponse = {
        users: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalUsers: 0,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      await adminService.listUsers();

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/admin/users?page=1&limit=10',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('throws error on failed request', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Access denied' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(adminService.listUsers(1, 10)).rejects.toThrow('Access denied');
    });
  });

  describe('deleteUser', () => {
    test('makes DELETE request to correct endpoint', async () => {
      const mockResponse = {
        message: 'User deleted successfully',
        deletedItems: 15,
        userId: 'user-123',
      };

      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const result = await adminService.deleteUser('user-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/admin/users/user-123',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.message).toBe('User deleted successfully');
      expect(result.deletedItems).toBe(15);
      expect(result.userId).toBe('user-123');
    });

    test('throws error when user not found', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'User not found' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(adminService.deleteUser('nonexistent-user')).rejects.toThrow('User not found');
    });
  });

  describe('cleanupAll', () => {
    test('makes POST request to cleanup endpoint', async () => {
      const mockResponse: CleanupResponse = {
        message: 'Cleanup completed successfully',
        deletedDynamoItems: 150,
        deletedS3Objects: 25,
        timestamp: '2024-01-15T10:30:00Z',
      };

      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const result = await adminService.cleanupAll();

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/admin/cleanup',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.message).toBe('Cleanup completed successfully');
      expect(result.deletedDynamoItems).toBe(150);
      expect(result.deletedS3Objects).toBe(25);
      expect(result.timestamp).toBe('2024-01-15T10:30:00Z');
    });

    test('throws error on cleanup failure', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Cleanup failed due to database error' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(adminService.cleanupAll()).rejects.toThrow('Cleanup failed due to database error');
    });
  });

  describe('generateTestData', () => {
    test('makes POST request with default parameters', async () => {
      const mockResponse: TestDataResponse = {
        message: 'Test data generated successfully',
        summary: {
          usersCreated: 5,
          postsCreated: 15,
          totalItems: 20,
        },
        users: [
          {
            userId: 'user-test-1',
            username: 'aurora_spark',
            displayName: 'Aurora Spark',
            postsCount: 3,
          },
          {
            userId: 'user-test-2',
            username: 'phoenix_dev',
            displayName: 'Phoenix Dev',
            postsCount: 3,
          },
        ],
        timestamp: '2024-01-15T10:45:00Z',
      };

      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const result = await adminService.generateTestData();

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/admin/test-data?userCount=5&postsPerUser=3',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.summary.usersCreated).toBe(5);
      expect(result.summary.postsCreated).toBe(15);
      expect(result.users).toHaveLength(2);
    });

    test('makes POST request with custom parameters', async () => {
      const mockResponse: TestDataResponse = {
        message: 'Test data generated successfully',
        summary: {
          usersCreated: 10,
          postsCreated: 50,
          totalItems: 60,
        },
        users: [],
        timestamp: '2024-01-15T10:45:00Z',
      };

      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const result = await adminService.generateTestData(10, 5);

      expect(fetch).toHaveBeenCalledWith(
        'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/admin/test-data?userCount=10&postsPerUser=5',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.summary.usersCreated).toBe(10);
      expect(result.summary.postsCreated).toBe(50);
    });

    test('throws error when parameters are invalid', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid parameters: userCount must be between 1 and 20' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(adminService.generateTestData(25, 3)).rejects.toThrow('Invalid parameters: userCount must be between 1 and 20');
    });
  });

  describe('Error handling', () => {
    test('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(adminService.listUsers()).rejects.toThrow('Network error');
    });

    test('handles response parsing errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(adminService.listUsers()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    test('handles malformed API responses', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(null),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.listUsers();
      expect(result).toBeNull();
    });

    test('handles timeout scenarios', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      (fetch as jest.Mock).mockRejectedValue(timeoutError);

      await expect(adminService.generateTestData()).rejects.toThrow('Request timeout');
    });
  });

  describe('makeRequest helper method', () => {
    test('correctly constructs API URLs', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ test: 'data' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await adminService.listUsers(2, 15);

      const expectedUrl = 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/admin/users?page=2&limit=15';
      expect(fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.any(Object)
      );
    });

    test('includes proper headers in all requests', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({}),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await adminService.deleteUser('test-user');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});