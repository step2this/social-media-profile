// Mock fetch globally
global.fetch = jest.fn();

const mockApiUrl = 'https://test-api.example.com/prod';

// Mock ServiceConfig
jest.mock('@/shared/config', () => ({
  ServiceConfig: {
    getApiUrl: () => 'https://test-api.example.com/prod',
  },
}));

import { adminService } from './admin';

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    test('makes GET request with default pagination', async () => {
      const mockUserListResponse = {
        users: [
          { userId: 'user-1', username: 'user1', displayName: 'User 1' },
          { userId: 'user-2', username: 'user2', displayName: 'User 2' },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 2,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockUserListResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.listUsers();

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/users?page=1&limit=10`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.users).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(1);
    });

    test('handles empty response gracefully', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => '0' }, // content-length: 0
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.listUsers();

      expect(result.users).toEqual([]);
      expect(result.pagination.totalUsers).toBe(0);
    });

    test('throws error on failed request', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Access denied' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(adminService.listUsers()).rejects.toThrow('Access denied');
    });
  });

  describe('deleteUser', () => {
    test('makes DELETE request to correct endpoint', async () => {
      const mockDeleteResponse = {
        message: 'User deleted successfully',
        deletedItems: 5,
        userId: 'user-123',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockDeleteResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.deleteUser('user-123');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/users/user-123`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.userId).toBe('user-123');
      expect(result.deletedItems).toBe(5);
    });

    test('throws error when user not found', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'User not found' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(adminService.deleteUser('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('cleanupAll', () => {
    test('makes POST request to cleanup endpoint', async () => {
      const mockCleanupResponse = {
        message: 'Cleanup completed successfully',
        deletedDynamoItems: 25,
        deletedS3Objects: 10,
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockCleanupResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.cleanupAll();

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/cleanup`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.deletedDynamoItems).toBe(25);
      expect(result.deletedS3Objects).toBe(10);
    });

    test('handles empty response with fallback', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => '0' }, // content-length: 0
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.cleanupAll();

      expect(result.message).toBe('Cleanup completed successfully');
      expect(result.deletedDynamoItems).toBe(0);
      expect(result.deletedS3Objects).toBe(0);
    });

    test('throws error on cleanup failure', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Cleanup failed' }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(adminService.cleanupAll()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('generateTestData', () => {
    test('makes POST request with default parameters', async () => {
      const mockTestDataResponse = {
        message: 'Test data generation completed successfully',
        summary: {
          usersCreated: 5,
          postsCreated: 15,
          totalItems: 20,
        },
        users: [
          { userId: 'user-1', username: 'testuser1', displayName: 'Test User 1', postsCount: 3 },
          { userId: 'user-2', username: 'testuser2', displayName: 'Test User 2', postsCount: 3 },
        ],
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockTestDataResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.generateTestData();

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/test-data?userCount=5&postsPerUser=3`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.summary.usersCreated).toBe(5);
      expect(result.summary.postsCreated).toBe(15);
    });

    test('makes POST request with custom parameters', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          message: 'Test data generated',
          summary: { usersCreated: 10, postsCreated: 20, totalItems: 30 },
          users: [],
          timestamp: '2024-01-01T00:00:00.000Z',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await adminService.generateTestData(10, 2);

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/test-data?userCount=10&postsPerUser=2`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    test('handles empty response with fallback', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => '0' }, // content-length: 0
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.generateTestData();

      expect(result.message).toBe('Test data generation completed successfully');
      expect(result.summary.usersCreated).toBe(0);
      expect(result.users).toEqual([]);
    });
  });

  describe('getEvents', () => {
    test('makes GET request with default limit', async () => {
      const mockEventsResponse = {
        events: [
          {
            eventId: 'event-1',
            source: 'social-media',
            detailType: 'Profile Created',
            detail: { userId: 'user-123' },
            timestamp: '2024-01-01T00:00:00.000Z',
            region: 'us-east-1',
            account: '123456789012',
          },
        ],
        totalEvents: 1,
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockEventsResponse),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.getEvents();

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/events?limit=50`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.events).toHaveLength(1);
      expect(result.totalEvents).toBe(1);
    });

    test('includes nextToken when provided', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ events: [], totalEvents: 0 }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await adminService.getEvents(25, 'next-token-123');

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/events?limit=25&nextToken=next-token-123`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('handles empty response with fallback', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => '0' }, // content-length: 0
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.getEvents();

      expect(result.events).toEqual([]);
      expect(result.totalEvents).toBe(0);
      expect(result.nextToken).toBeUndefined();
    });
  });
});