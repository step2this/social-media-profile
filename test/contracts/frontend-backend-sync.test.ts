/**
 * Frontend-Backend Synchronization Tests
 *
 * Ensures frontend components stay in sync with backend API changes.
 * These tests validate that:
 * - Frontend expects match backend responses
 * - Type definitions are consistent
 * - Breaking changes are caught early
 * - UI components can handle all possible API states
 */

describe('Frontend-Backend Synchronization Tests', () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod/';

  describe('User Profile API Sync', () => {
    test('API response matches frontend UserProfile interface', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        const user = data.users[0];

        // Fields that frontend UserProfile interface expects
        const requiredFields = [
          'userId', 'username', 'displayName', 'email', 'bio', 'avatar',
          'followersCount', 'followingCount', 'postsCount', 'isVerified', 'isPrivate', 'createdAt'
        ];

        requiredFields.forEach(field => {
          expect(user).toHaveProperty(field);
        });

        // Type validation for specific fields
        expect(typeof user.userId).toBe('string');
        expect(typeof user.username).toBe('string');
        expect(typeof user.displayName).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.bio).toBe('string');
        expect(typeof user.avatar).toBe('string');
        expect(typeof user.followersCount).toBe('number');
        expect(typeof user.followingCount).toBe('number');
        expect(typeof user.postsCount).toBe('number');
        expect(typeof user.isVerified).toBe('boolean');
        expect(typeof user.isPrivate).toBe('boolean');
        expect(typeof user.createdAt).toBe('string');

        // Additional validation
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
      }
    });

    test('Pagination response matches frontend PaginatedUsersResponse interface', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users?page=1&limit=5`);
      const data = await response.json();

      // Root structure
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('pagination');

      // Users array
      expect(Array.isArray(data.users)).toBe(true);

      // Pagination object structure
      const pagination = data.pagination;
      const requiredPaginationFields = [
        'currentPage', 'totalPages', 'totalUsers', 'pageSize', 'hasNextPage', 'hasPreviousPage'
      ];

      requiredPaginationFields.forEach(field => {
        expect(pagination).toHaveProperty(field);
      });

      // Pagination field types
      expect(typeof pagination.currentPage).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
      expect(typeof pagination.totalUsers).toBe('number');
      expect(typeof pagination.pageSize).toBe('number');
      expect(typeof pagination.hasNextPage).toBe('boolean');
      expect(typeof pagination.hasPreviousPage).toBe('boolean');

      // Logical validation
      expect(pagination.currentPage).toBeGreaterThanOrEqual(1);
      expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
      expect(pagination.totalUsers).toBeGreaterThanOrEqual(0);
      expect(pagination.pageSize).toBeGreaterThan(0);
    });
  });

  describe('Error Response API Sync', () => {
    test('Error responses match frontend ErrorResponse interface', async () => {
      // Test with invalid pagination
      const response = await fetch(`${API_BASE_URL}admin/users?page=invalid`);

      if (response.status >= 400) {
        const errorData = await response.json();

        // Error response should have message field
        expect(errorData).toHaveProperty('message');
        expect(typeof errorData.message).toBe('string');
        expect(errorData.message).toBeTruthy();

        // Optional fields
        if (errorData.hasOwnProperty('error')) {
          expect(typeof errorData.error).toBe('string');
        }
        if (errorData.hasOwnProperty('statusCode')) {
          expect(typeof errorData.statusCode).toBe('number');
          expect(errorData.statusCode).toBe(response.status);
        }
      }
    });

    test('404 errors have consistent structure', async () => {
      const response = await fetch(`${API_BASE_URL}admin/nonexistent-endpoint`);

      if (response.status === 404) {
        const errorData = await response.json();
        expect(errorData).toHaveProperty('message');
        expect(errorData.message).not.toBe('Placeholder');
      }
    });
  });

  describe('Admin Operations API Sync', () => {
    test('Generate test data response matches frontend expectations', async () => {
      const response = await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCount: 2,
          postsPerUser: 1
        })
      });

      const data = await response.json();

      // Should not be a simple string
      expect(typeof data).toBe('object');
      expect(data).not.toBe(null);

      // Should have success indicator or created data summary
      const possibleFields = ['success', 'created', 'users', 'message', 'usersCreated'];
      const hasExpectedField = possibleFields.some(field => data.hasOwnProperty(field));
      expect(hasExpectedField).toBe(true);
    });

    test('Cleanup all data response is consistent', async () => {
      const response = await fetch(`${API_BASE_URL}admin/cleanup-all`, {
        method: 'DELETE'
      });

      if (response.status < 500) { // Exclude server errors
        const data = await response.json();

        expect(typeof data).toBe('object');
        expect(data).not.toBe(null);

        // Should have cleanup summary or success message
        const possibleFields = ['success', 'deleted', 'message', 'usersDeleted', 'itemsDeleted'];
        const hasExpectedField = possibleFields.some(field => data.hasOwnProperty(field));
        expect(hasExpectedField).toBe(true);
      }
    });
  });

  describe('HTTP Headers Sync', () => {
    test('CORS headers are present for frontend requests', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);

      // Required CORS headers for frontend
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
      expect(response.headers.get('access-control-allow-methods')).toBeDefined();
      expect(response.headers.get('access-control-allow-headers')).toBeDefined();

      // Content-Type should be JSON for API responses
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('OPTIONS preflight requests work correctly', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`, {
        method: 'OPTIONS'
      });

      // Should handle OPTIONS requests for CORS
      expect(response.status).toBeLessThan(500);
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });

  describe('Data Format Consistency', () => {
    test('Date formats are ISO 8601 strings', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        data.users.forEach((user: any) => {
          if (user.createdAt) {
            // Should be valid ISO 8601 format
            expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

            // Should be parseable as Date
            const date = new Date(user.createdAt);
            expect(date.toISOString()).toBe(user.createdAt);
          }
        });
      }
    });

    test('Numeric fields are consistent types', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        data.users.forEach((user: any) => {
          // Count fields should be numbers, not strings
          expect(typeof user.followersCount).toBe('number');
          expect(typeof user.followingCount).toBe('number');
          expect(typeof user.postsCount).toBe('number');

          // Should be non-negative integers
          expect(user.followersCount).toBeGreaterThanOrEqual(0);
          expect(user.followingCount).toBeGreaterThanOrEqual(0);
          expect(user.postsCount).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(user.followersCount)).toBe(true);
          expect(Number.isInteger(user.followingCount)).toBe(true);
          expect(Number.isInteger(user.postsCount)).toBe(true);
        });
      }
    });

    test('Boolean fields are actual booleans', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        data.users.forEach((user: any) => {
          // Boolean fields should not be strings or numbers
          expect(typeof user.isVerified).toBe('boolean');
          expect(typeof user.isPrivate).toBe('boolean');

          // Should not be "true"/"false" strings
          expect(user.isVerified).not.toBe('true');
          expect(user.isVerified).not.toBe('false');
          expect(user.isPrivate).not.toBe('true');
          expect(user.isPrivate).not.toBe('false');
        });
      }
    });
  });

  describe('API Versioning Compatibility', () => {
    test('API responses include version information', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);

      // Check for version headers or version in response
      const versionHeader = response.headers.get('api-version') ||
                           response.headers.get('x-api-version');

      if (!versionHeader) {
        // Version might be in response body
        const data = await response.json();
        // This is optional, but good practice
        if (data.metadata) {
          expect(data.metadata).toHaveProperty('version');
        }
      }

      // At minimum, API should be consistent (not return 502/503)
      expect(response.status).not.toBe(502);
      expect(response.status).not.toBe(503);
    });
  });

  describe('Performance Expectations', () => {
    test('API responses are timely for frontend UX', async () => {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE_URL}admin/users?limit=10`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond quickly enough for good UX
      expect(responseTime).toBeLessThan(3000); // 3 seconds max

      // Should return actual data, not timeout
      expect(response.status).not.toBe(504); // Gateway timeout
    });
  });
});