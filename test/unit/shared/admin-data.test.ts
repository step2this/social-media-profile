import { AdminData } from '../../__mocks__/lambda/shared/admin-data';
import { TestDataFactory } from '../../fixtures/test-data';

describe('AdminData - Pure Business Logic Tests', () => {
  describe('deleteUser', () => {
    it('should successfully delete a user', async () => {
      const userId = 'user-123';
      const result = await AdminData.deleteUser(userId);

      expect(result).toEqual({
        success: true,
        deletedUser: userId
      });
    });

    it('should handle deletion of different user IDs', async () => {
      const userIds = ['user-1', 'user-2', 'admin-user'];

      for (const userId of userIds) {
        const result = await AdminData.deleteUser(userId);
        expect(result.success).toBe(true);
        expect(result.deletedUser).toBe(userId);
      }
    });
  });

  describe('listUsers', () => {
    it('should return paginated user list with default parameters', async () => {
      const result = await AdminData.listUsers();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(50);
    });

    it('should handle custom pagination parameters', async () => {
      const page = 2;
      const limit = 25;

      const result = await AdminData.listUsers(page, limit);

      expect(result.pagination.currentPage).toBe(page);
      expect(result.pagination.pageSize).toBe(limit);
    });

    it('should return users with expected structure', async () => {
      const result = await AdminData.listUsers();

      if (result.users.length > 0) {
        const user = result.users[0];
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('displayName');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('followersCount');
        expect(user).toHaveProperty('followingCount');
        expect(user).toHaveProperty('postsCount');
      }
    });

    it('should handle pagination metadata correctly', async () => {
      const result = await AdminData.listUsers(1, 50);

      expect(result.pagination).toMatchObject({
        currentPage: 1,
        totalPages: expect.any(Number),
        totalUsers: expect.any(Number),
        pageSize: 50,
        hasNextPage: expect.any(Boolean),
        hasPreviousPage: expect.any(Boolean)
      });
    });
  });

  describe('generateTestData', () => {
    it('should generate test data with specified parameters', async () => {
      const userCount = 5;
      const postsPerUser = 3;

      const result = await AdminData.generateTestData(userCount, postsPerUser);

      expect(result).toEqual({
        success: true,
        usersCreated: userCount,
        postsCreated: userCount * postsPerUser
      });
    });

    it('should handle different data generation scenarios', async () => {
      const scenarios = [
        { users: 1, posts: 0 },
        { users: 10, posts: 5 },
        { users: 0, posts: 0 }
      ];

      for (const scenario of scenarios) {
        const result = await AdminData.generateTestData(scenario.users, scenario.posts);
        expect(result.success).toBe(true);
        expect(result.usersCreated).toBe(scenario.users);
        expect(result.postsCreated).toBe(scenario.users * scenario.posts);
      }
    });
  });

  describe('cleanupAllData', () => {
    it('should successfully cleanup all data', async () => {
      const result = await AdminData.cleanupAllData();

      expect(result).toEqual({
        success: true,
        usersDeleted: expect.any(Number),
        postsDeleted: expect.any(Number),
        itemsDeleted: expect.any(Number)
      });
    });

    it('should return consistent cleanup structure', async () => {
      const result = await AdminData.cleanupAllData();

      expect(result.success).toBe(true);
      expect(typeof result.usersDeleted).toBe('number');
      expect(typeof result.postsDeleted).toBe('number');
      expect(typeof result.itemsDeleted).toBe('number');
      expect(result.usersDeleted).toBeGreaterThanOrEqual(0);
      expect(result.postsDeleted).toBeGreaterThanOrEqual(0);
      expect(result.itemsDeleted).toBeGreaterThanOrEqual(0);
    });
  });
});