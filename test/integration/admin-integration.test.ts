// Integration tests for admin functionality
// These tests run against the actual deployed AWS infrastructure

describe('Admin Integration Tests', () => {
  let apiUrl: string;

  beforeAll(() => {
    // Use the actual API URL from environment or default
    apiUrl = process.env.API_URL || 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod';
  });

  const makeApiRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> => {
    const url = `${apiUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    return response.json();
  };

  describe('Test Data Generation', () => {
    test('can generate test users and posts', async () => {
      // First cleanup any existing data
      try {
        await makeApiRequest('/admin/cleanup', { method: 'POST' });
      } catch (error) {
        // Cleanup might fail if no data exists, that's ok
        console.log('Cleanup before test:', error);
      }

      // Generate test data
      const result = await makeApiRequest('/admin/test-data?userCount=3&postsPerUser=2', {
        method: 'POST',
      });

      expect(result.summary.usersCreated).toBe(3);
      expect(result.summary.postsCreated).toBe(6);
      expect(result.users).toHaveLength(3);
      expect(result.users[0]).toHaveProperty('userId');
      expect(result.users[0]).toHaveProperty('username');
      expect(result.users[0]).toHaveProperty('displayName');
      expect(result.users[0].postsCount).toBe(2);
    }, 30000); // 30 second timeout for AWS operations

    test('validates test data parameters', async () => {
      // Test that parameters are capped at max values (our implementation caps rather than errors)
      const result1 = await makeApiRequest('/admin/test-data?userCount=25&postsPerUser=2', {
        method: 'POST',
      });
      expect(result1.summary.usersCreated).toBeLessThanOrEqual(20);

      const result2 = await makeApiRequest('/admin/test-data?userCount=5&postsPerUser=15', {
        method: 'POST',
      });
      expect(result2.summary.postsCreated).toBeLessThanOrEqual(50); // 5 users * 10 posts max
    }, 30000);
  });

  describe('User Management', () => {
    let testUserId: string;

    beforeAll(async () => {
      // Generate a test user for management operations
      const result = await makeApiRequest('/admin/test-data?userCount=1&postsPerUser=1', {
        method: 'POST',
      });
      testUserId = result.users[0].userId;
    }, 30000);

    test('can list users with pagination', async () => {
      const result = await makeApiRequest('/admin/users?page=1&limit=5');

      expect(Array.isArray(result.users)).toBe(true);
      expect(result.pagination).toHaveProperty('currentPage', 1);
      expect(result.pagination).toHaveProperty('pageSize', 5);
      expect(result.pagination).toHaveProperty('totalUsers');
      expect(result.pagination).toHaveProperty('totalPages');
      expect(result.pagination).toHaveProperty('hasNextPage');
      expect(result.pagination).toHaveProperty('hasPreviousPage');

      // Verify user structure
      if (result.users.length > 0) {
        const user = result.users[0];
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('displayName');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('followersCount');
        expect(user).toHaveProperty('postsCount');
        expect(user).toHaveProperty('createdAt');
      }
    }, 15000);

    test('can delete a specific user', async () => {
      // Verify user exists first
      const usersList = await makeApiRequest('/admin/users?page=1&limit=50');
      const userExists = usersList.users.some((u: any) => u.userId === testUserId);
      expect(userExists).toBe(true);

      // Delete the user
      const deleteResult = await makeApiRequest(`/admin/users/${testUserId}`, {
        method: 'DELETE',
      });

      expect(deleteResult.message).toContain('deleted successfully');
      expect(deleteResult.userId).toBe(testUserId);
      expect(deleteResult.deletedItems).toBeGreaterThan(0);

      // Verify user no longer exists
      const updatedUsersList = await makeApiRequest('/admin/users?page=1&limit=50');
      const userStillExists = updatedUsersList.users.some((u: any) => u.userId === testUserId);
      expect(userStillExists).toBe(false);
    }, 15000);

    test('handles deletion of non-existent user', async () => {
      await expect(
        makeApiRequest('/admin/users/non-existent-user-id', {
          method: 'DELETE',
        })
      ).rejects.toThrow(/User not found/);
    }, 10000);
  });

  describe('Data Cleanup', () => {
    beforeAll(async () => {
      // Generate some test data to cleanup
      await makeApiRequest('/admin/test-data?userCount=2&postsPerUser=1', {
        method: 'POST',
      });
    }, 30000);

    test('can cleanup all data', async () => {
      const result = await makeApiRequest('/admin/cleanup', {
        method: 'POST',
      });

      expect(result.message).toContain('completed successfully');
      expect(result.deletedDynamoItems).toBeGreaterThanOrEqual(0);
      expect(result.deletedS3Objects).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeTruthy();

      // Verify all users are gone
      const usersList = await makeApiRequest('/admin/users?page=1&limit=50');
      expect(usersList.users).toHaveLength(0);
      expect(usersList.pagination.totalUsers).toBe(0);
    }, 30000);
  });

  describe('Error Handling', () => {
    test('handles invalid endpoints gracefully', async () => {
      await expect(
        makeApiRequest('/admin/invalid-endpoint')
      ).rejects.toThrow();
    }, 10000);

    test('handles malformed requests', async () => {
      await expect(
        makeApiRequest('/admin/users/invalid-user-id-format', {
          method: 'DELETE',
        })
      ).rejects.toThrow();
    }, 10000);
  });

  describe('End-to-End Workflow', () => {
    test('complete admin workflow: generate -> list -> delete -> cleanup', async () => {
      // Step 1: Generate test data
      const generateResult = await makeApiRequest('/admin/test-data?userCount=2&postsPerUser=1', {
        method: 'POST',
      });
      expect(generateResult.summary.usersCreated).toBe(2);

      // Step 2: List users to verify creation
      const listResult = await makeApiRequest('/admin/users?page=1&limit=10');
      expect(listResult.users.length).toBeGreaterThanOrEqual(2);
      expect(listResult.pagination.totalUsers).toBeGreaterThanOrEqual(2);

      // Step 3: Delete one user
      const userToDelete = listResult.users[0];
      const deleteResult = await makeApiRequest(`/admin/users/${userToDelete.userId}`, {
        method: 'DELETE',
      });
      expect(deleteResult.message).toContain('deleted successfully');

      // Step 4: Verify user count decreased
      const listAfterDelete = await makeApiRequest('/admin/users?page=1&limit=10');
      expect(listAfterDelete.pagination.totalUsers).toBe(listResult.pagination.totalUsers - 1);

      // Step 5: Cleanup remaining data
      const cleanupResult = await makeApiRequest('/admin/cleanup', {
        method: 'POST',
      });
      expect(cleanupResult.message).toContain('completed successfully');

      // Step 6: Verify cleanup completed
      const finalList = await makeApiRequest('/admin/users?page=1&limit=10');
      expect(finalList.users).toHaveLength(0);
    }, 60000); // 60 second timeout for full workflow
  });
});

describe('Social Features Integration', () => {
  let apiUrl: string;
  let testUsers: any[] = [];

  beforeAll(async () => {
    apiUrl = process.env.API_URL || 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod';

    // Generate test users for social feature testing
    const result = await fetch(`${apiUrl}/admin/test-data?userCount=3&postsPerUser=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (result.ok) {
      const data = await result.json() as any;
      testUsers = data.users;
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup test data
    try {
      await fetch(`${apiUrl}/admin/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  }, 30000);

  const makeApiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    return response.json();
  };

  test('can retrieve user profiles and posts', async () => {
    if (testUsers.length < 2) {
      console.log('Skipping test - insufficient test users');
      return;
    }

    const userId = testUsers[0].userId;

    // Test profile endpoint
    const profile = await makeApiRequest(`/profiles/${userId}`);
    expect(profile.userId).toBe(userId);
    expect(profile.username).toBeTruthy();
    expect(profile.displayName).toBeTruthy();
    expect(profile.postsCount).toBeGreaterThan(0);

    // Test posts endpoint
    const postsResponse = await makeApiRequest(`/posts/user/${userId}`);
    expect(postsResponse.userId).toBe(userId);
    expect(Array.isArray(postsResponse.posts)).toBe(true);
    expect(postsResponse.posts.length).toBeGreaterThan(0);
  }, 15000);

  test('can follow and unfollow users', async () => {
    if (testUsers.length < 2) {
      console.log('Skipping test - insufficient test users');
      return;
    }

    const followerId = testUsers[0].userId;
    const followedUserId = testUsers[1].userId;

    // Follow user
    const followResult = await makeApiRequest('/social/follow', {
      method: 'POST',
      body: JSON.stringify({ followerId, followedUserId }),
    });

    expect(followResult.message).toContain('Successfully followed');
    expect(followResult.followerId).toBe(followerId);
    expect(followResult.followedUserId).toBe(followedUserId);

    // Check follow status
    const statusResult = await makeApiRequest(`/social/check-follow/${followerId}/${followedUserId}`);
    expect(statusResult.isFollowing).toBe(true);

    // Unfollow user
    const unfollowResult = await makeApiRequest('/social/unfollow', {
      method: 'POST',
      body: JSON.stringify({ followerId, followedUserId }),
    });

    expect(unfollowResult.message).toContain('Successfully unfollowed');

    // Verify unfollow
    const statusAfterUnfollow = await makeApiRequest(`/social/check-follow/${followerId}/${followedUserId}`);
    expect(statusAfterUnfollow.isFollowing).toBe(false);
  }, 20000);

  test('can retrieve user feed', async () => {
    if (testUsers.length < 2) {
      console.log('Skipping test - insufficient test users');
      return;
    }

    const userId = testUsers[0].userId;
    const feedResult = await makeApiRequest(`/feed/${userId}`);

    expect(feedResult.userId).toBe(userId);
    expect(Array.isArray(feedResult.feedItems)).toBe(true);
    // Feed might be empty if user doesn't follow anyone, that's ok
  }, 15000);
});