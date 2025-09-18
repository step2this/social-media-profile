/**
 * End-to-End User Journey Tests
 *
 * Tests complete user workflows from frontend to backend.
 * These are the minimal set of E2E tests (5% of testing pyramid)
 * that validate critical user paths work end-to-end.
 *
 * Focus: Critical business flows that span multiple components
 */

describe('End-to-End User Journey Tests', () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod/';

  beforeEach(async () => {
    // Clean slate for each test
    try {
      await fetch(`${API_BASE_URL}admin/cleanup-all`, { method: 'DELETE' });
    } catch (error) {
      // Cleanup may fail if no data exists - that's OK
    }
  });

  describe('Admin User Management Journey', () => {
    test('Complete admin workflow: create users → view users → cleanup', async () => {
      // Step 1: Generate test data (simulates admin creating users)
      const createResponse = await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userCount: 3,
          postsPerUser: 2
        })
      });

      expect(createResponse.status).toBeLessThan(500);
      const createData = await createResponse.json();
      expect(createData).toBeDefined();
      expect(typeof createData).toBe('object');

      // Step 2: View created users (simulates admin viewing user list)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Allow for eventual consistency

      const listResponse = await fetch(`${API_BASE_URL}admin/users`);
      expect(listResponse.status).toBe(200);

      const listData = await listResponse.json();
      expect(listData).toHaveProperty('users');
      expect(listData).toHaveProperty('pagination');
      expect(Array.isArray(listData.users)).toBe(true);
      expect(listData.users.length).toBeGreaterThan(0);

      // Step 3: Verify user data structure (simulates frontend rendering)
      const firstUser = listData.users[0];
      expect(firstUser).toHaveProperty('userId');
      expect(firstUser).toHaveProperty('username');
      expect(firstUser).toHaveProperty('displayName');
      expect(firstUser).toHaveProperty('email');

      // Step 4: Clean up (simulates admin cleanup)
      const cleanupResponse = await fetch(`${API_BASE_URL}admin/cleanup-all`, {
        method: 'DELETE'
      });

      expect(cleanupResponse.status).toBeLessThan(500);
      const cleanupData = await cleanupResponse.json();
      expect(cleanupData).toBeDefined();

      // Step 5: Verify cleanup worked
      await new Promise(resolve => setTimeout(resolve, 1000)); // Allow for cleanup

      const emptyListResponse = await fetch(`${API_BASE_URL}admin/users`);
      const emptyListData = await emptyListResponse.json();
      expect(emptyListData.users.length).toBe(0);
    }, 15000); // Allow time for eventual consistency

    test('Admin pagination workflow', async () => {
      // Setup: Create enough users for pagination
      await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userCount: 12,
          postsPerUser: 1
        })
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Test: First page
      const page1Response = await fetch(`${API_BASE_URL}admin/users?page=1&limit=5`);
      const page1Data = await page1Response.json();

      expect(page1Data.users.length).toBeLessThanOrEqual(5);
      expect(page1Data.pagination.currentPage).toBe(1);
      expect(page1Data.pagination.pageSize).toBe(5);
      expect(page1Data.pagination.totalUsers).toBeGreaterThanOrEqual(12);

      // Test: Second page (if it exists)
      if (page1Data.pagination.hasNextPage) {
        const page2Response = await fetch(`${API_BASE_URL}admin/users?page=2&limit=5`);
        const page2Data = await page2Response.json();

        expect(page2Data.pagination.currentPage).toBe(2);
        expect(page2Data.pagination.hasPreviousPage).toBe(true);
      }
    }, 20000);
  });

  describe('Data Consistency Journey', () => {
    test('User creation to retrieval consistency', async () => {
      // Create users with specific data
      const createResponse = await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userCount: 2,
          postsPerUser: 3
        })
      });

      expect(createResponse.status).toBeLessThan(500);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Retrieve and verify data consistency
      const listResponse = await fetch(`${API_BASE_URL}admin/users`);
      const listData = await listResponse.json();

      expect(listData.users.length).toBe(2);

      // Verify each user has expected post count
      listData.users.forEach((user: any) => {
        expect(user.postsCount).toBe(3);
        expect(user.followersCount).toBeGreaterThanOrEqual(0);
        expect(user.followingCount).toBeGreaterThanOrEqual(0);

        // Verify data types are correct for frontend consumption
        expect(typeof user.userId).toBe('string');
        expect(typeof user.username).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.isVerified).toBe('boolean');
        expect(typeof user.isPrivate).toBe('boolean');

        // Verify data format consistency
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(user.username).toMatch(/^[a-zA-Z0-9_]+$/);
      });
    }, 15000);
  });

  describe('Error Handling Journey', () => {
    test('Invalid requests return proper errors for frontend handling', async () => {
      // Test invalid pagination
      const invalidPageResponse = await fetch(`${API_BASE_URL}admin/users?page=invalid`);

      if (invalidPageResponse.status >= 400) {
        const errorData = await invalidPageResponse.json();
        expect(errorData).toHaveProperty('message');
        expect(typeof errorData.message).toBe('string');
        expect(errorData.message).not.toBe('Placeholder');
      }

      // Test invalid endpoint
      const invalidEndpointResponse = await fetch(`${API_BASE_URL}admin/nonexistent`);
      expect([400, 403, 404, 405]).toContain(invalidEndpointResponse.status);

      // Test malformed request body
      const malformedBodyResponse = await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(malformedBodyResponse.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Performance Journey', () => {
    test('Typical admin workflow completes within acceptable time', async () => {
      const startTime = Date.now();

      // Simulate typical admin session
      // 1. Create test data
      await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCount: 5, postsPerUser: 1 })
      });

      // 2. View users (multiple times as admin navigates)
      await fetch(`${API_BASE_URL}admin/users`);
      await fetch(`${API_BASE_URL}admin/users?page=1&limit=10`);

      // 3. Cleanup
      await fetch(`${API_BASE_URL}admin/cleanup-all`, { method: 'DELETE' });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete in reasonable time for good UX
      expect(totalTime).toBeLessThan(10000); // 10 seconds max
    }, 15000);

    test('Cold start performance is acceptable', async () => {
      // First request after potential cold start
      const startTime = Date.now();

      const response = await fetch(`${API_BASE_URL}admin/users`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBeLessThan(500);
      // Allow for Lambda cold start
      expect(responseTime).toBeLessThan(10000); // 10 seconds for cold start

      console.log(`Cold start response time: ${responseTime}ms`);
    });
  });

  describe('CORS and Security Journey', () => {
    test('Frontend can make requests with proper CORS', async () => {
      // Simulate browser preflight request
      const preflightResponse = await fetch(`${API_BASE_URL}admin/users`, {
        method: 'OPTIONS'
      });

      expect(preflightResponse.status).toBeLessThan(500);

      // Actual request should work
      const actualResponse = await fetch(`${API_BASE_URL}admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000' // Simulate frontend origin
        }
      });

      expect(actualResponse.status).toBeLessThan(500);
      expect(actualResponse.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });

  describe('Frontend Integration Journey', () => {
    test('API responses can be consumed by frontend without transformation', async () => {
      // Create test data
      await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCount: 1, postsPerUser: 1 })
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get users and simulate frontend processing
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const data = await response.json();

      // Frontend should be able to directly use this data
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);

      if (data.users.length > 0) {
        const user = data.users[0];

        // Test that frontend can render user card without data transformation
        const userCard = {
          id: user.userId,
          name: user.displayName,
          handle: user.username,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          stats: {
            followers: user.followersCount,
            following: user.followingCount,
            posts: user.postsCount
          },
          badges: {
            verified: user.isVerified,
            private: user.isPrivate
          },
          joinDate: new Date(user.createdAt)
        };

        // All fields should be usable by frontend
        expect(userCard.id).toBeTruthy();
        expect(userCard.name).toBeTruthy();
        expect(userCard.handle).toBeTruthy();
        expect(userCard.email).toBeTruthy();
        expect(typeof userCard.stats.followers).toBe('number');
        expect(typeof userCard.badges.verified).toBe('boolean');
        expect(userCard.joinDate instanceof Date).toBe(true);
      }
    }, 10000);
  });
});