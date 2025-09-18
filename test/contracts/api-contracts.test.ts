/**
 * API Contract Tests
 *
 * These tests validate that our API responses match expected schemas
 * and would have caught the "Placeholder" response issues we encountered.
 * They ensure frontend-backend compatibility.
 */

interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  createdAt: string;
}

interface PaginatedUsersResponse {
  users: UserProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

describe('API Contract Tests', () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod/';

  describe('Admin Endpoints Contract Validation', () => {
    test('/admin/users should return paginated users with correct schema', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();

      // Should not be a simple string (like "Placeholder")
      expect(typeof data).toBe('object');
      expect(data).not.toBe(null);

      // Validate response structure
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('pagination');

      // Validate users array
      expect(Array.isArray(data.users)).toBe(true);

      // If users exist, validate user schema
      if (data.users.length > 0) {
        const user = data.users[0];
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('displayName');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('followersCount');
        expect(user).toHaveProperty('followingCount');
        expect(user).toHaveProperty('postsCount');
        expect(user).toHaveProperty('isVerified');
        expect(user).toHaveProperty('isPrivate');
        expect(user).toHaveProperty('createdAt');

        // Validate data types
        expect(typeof user.userId).toBe('string');
        expect(typeof user.username).toBe('string');
        expect(typeof user.displayName).toBe('string');
        expect(typeof user.followersCount).toBe('number');
        expect(typeof user.isVerified).toBe('boolean');
      }

      // Validate pagination schema
      const pagination = data.pagination;
      expect(pagination).toHaveProperty('currentPage');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('totalUsers');
      expect(pagination).toHaveProperty('pageSize');
      expect(pagination).toHaveProperty('hasNextPage');
      expect(pagination).toHaveProperty('hasPreviousPage');

      // Validate pagination types
      expect(typeof pagination.currentPage).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
      expect(typeof pagination.totalUsers).toBe('number');
      expect(typeof pagination.pageSize).toBe('number');
      expect(typeof pagination.hasNextPage).toBe('boolean');
      expect(typeof pagination.hasPreviousPage).toBe('boolean');
    });

    test('/admin/users should handle pagination parameters correctly', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users?page=1&limit=5`);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.pagination.currentPage).toBe(1);
      expect(data.pagination.pageSize).toBe(5);
      expect(data.users.length).toBeLessThanOrEqual(5);
    });

    test('/admin/test-data POST should return success response', async () => {
      const response = await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCount: 3,
          postsPerUser: 2
        })
      });

      // Should be successful or at least not return placeholder
      const text = await response.text();
      expect(text).not.toBe('Placeholder');
      expect(text.toLowerCase()).not.toContain('placeholder');

      // Should be valid JSON
      const data = JSON.parse(text);
      expect(typeof data).toBe('object');
    });
  });

  describe('Error Response Contract Validation', () => {
    test('should return proper error format for invalid requests', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users?page=invalid`);

      const data = await response.json();

      // Should have error structure
      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');

      // Should not be placeholder
      expect(data.message).not.toBe('Placeholder');
      expect(data.message.toLowerCase()).not.toContain('placeholder');
    });

    test('should have CORS headers for browser compatibility', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);

      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
      expect(response.headers.get('access-control-allow-methods')).toBeDefined();
      expect(response.headers.get('access-control-allow-headers')).toBeDefined();
    });
  });

  describe('Data Consistency Validation', () => {
    test('user data should be internally consistent', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        data.users.forEach((user: UserProfile) => {
          // Username should be valid format
          expect(user.username).toMatch(/^[a-zA-Z0-9_]+$/);

          // Email should be valid format
          expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

          // Counters should be non-negative
          expect(user.followersCount).toBeGreaterThanOrEqual(0);
          expect(user.followingCount).toBeGreaterThanOrEqual(0);
          expect(user.postsCount).toBeGreaterThanOrEqual(0);

          // CreatedAt should be valid ISO date
          expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
        });
      }
    });
  });
});

/**
 * Schema Validation Helpers
 * These would be used by frontend to validate API responses
 */
export function validateUserProfile(user: any): user is UserProfile {
  return (
    typeof user === 'object' &&
    typeof user.userId === 'string' &&
    typeof user.username === 'string' &&
    typeof user.displayName === 'string' &&
    typeof user.email === 'string' &&
    typeof user.bio === 'string' &&
    typeof user.avatar === 'string' &&
    typeof user.followersCount === 'number' &&
    typeof user.followingCount === 'number' &&
    typeof user.postsCount === 'number' &&
    typeof user.isVerified === 'boolean' &&
    typeof user.isPrivate === 'boolean' &&
    typeof user.createdAt === 'string'
  );
}

export function validatePaginatedUsersResponse(data: any): data is PaginatedUsersResponse {
  return (
    typeof data === 'object' &&
    Array.isArray(data.users) &&
    data.users.every(validateUserProfile) &&
    typeof data.pagination === 'object' &&
    typeof data.pagination.currentPage === 'number' &&
    typeof data.pagination.totalPages === 'number' &&
    typeof data.pagination.totalUsers === 'number' &&
    typeof data.pagination.pageSize === 'number' &&
    typeof data.pagination.hasNextPage === 'boolean' &&
    typeof data.pagination.hasPreviousPage === 'boolean'
  );
}