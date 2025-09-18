import { ProfileData } from '../../__mocks__/lambda/shared/profile-data';
import { TestDataFactory } from '../../fixtures/test-data';

describe('ProfileData - Pure Business Logic Tests', () => {
  describe('createProfile', () => {
    it('should create a profile with generated data', async () => {
      const profileInput = {
        username: 'newuser',
        email: 'new@example.com',
        displayName: 'New User',
        bio: 'Test bio'
      };

      const result = await ProfileData.createProfile(profileInput);

      expect(result).toMatchObject({
        ...profileInput,
        userId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should preserve provided userId when creating profile', async () => {
      const profileInput = {
        userId: 'custom-123',
        username: 'customuser',
        email: 'custom@example.com',
        displayName: 'Custom User'
      };

      const result = await ProfileData.createProfile(profileInput);

      expect(result.userId).toBe('custom-123');
      expect(result.username).toBe('customuser');
    });

    it('should handle profile creation with minimal data', async () => {
      const profileInput = {
        username: 'minimal',
        email: 'minimal@example.com'
      };

      const result = await ProfileData.createProfile(profileInput);

      expect(result.username).toBe('minimal');
      expect(result.email).toBe('minimal@example.com');
      expect(result.userId).toBeDefined();
    });
  });

  describe('getProfile', () => {
    it('should retrieve a profile by ID', async () => {
      const userId = 'user-123';
      const result = await ProfileData.getProfile(userId);

      expect(result).toMatchObject({
        userId,
        username: expect.any(String),
        displayName: expect.any(String),
        email: expect.any(String)
      });
    });

    it('should return consistent profile structure', async () => {
      const testUser = TestDataFactory.createUser();
      const result = await ProfileData.getProfile(testUser.userId);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('displayName');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('bio');
      expect(result).toHaveProperty('avatar');
      expect(result).toHaveProperty('followersCount');
      expect(result).toHaveProperty('followingCount');
      expect(result).toHaveProperty('postsCount');
      expect(result).toHaveProperty('isVerified');
      expect(result).toHaveProperty('isPrivate');
    });
  });

  describe('updateProfile', () => {
    it('should update profile with new data', async () => {
      const userId = 'user-123';
      const updates = {
        displayName: 'Updated Name',
        bio: 'Updated bio'
      };

      const result = await ProfileData.updateProfile(userId, updates);

      expect(result).toMatchObject({
        userId,
        displayName: 'Updated Name',
        bio: 'Updated bio',
        updatedAt: expect.any(String)
      });
    });

    it('should handle partial updates', async () => {
      const userId = 'user-123';
      const updates = { bio: 'New bio only' };

      const result = await ProfileData.updateProfile(userId, updates);

      expect(result.bio).toBe('New bio only');
      expect(result.userId).toBe(userId);
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('deleteProfile', () => {
    it('should successfully delete a profile', async () => {
      const userId = 'user-123';
      const result = await ProfileData.deleteProfile(userId);

      expect(result).toEqual({
        success: true,
        deletedUserId: userId
      });
    });
  });

  describe('getPublicProfile', () => {
    it('should filter out sensitive data from profile', () => {
      const testUser = TestDataFactory.createUser({
        email: 'private@example.com',
        userId: 'user-123'
      });

      const result = ProfileData.getPublicProfile(testUser);

      expect(result).not.toHaveProperty('email');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('displayName');
    });

    it('should handle null input gracefully', () => {
      const result = ProfileData.getPublicProfile(null);
      expect(result).toBeNull();
    });

    it('should handle undefined input gracefully', () => {
      const result = ProfileData.getPublicProfile(undefined);
      expect(result).toBeNull();
    });

    it('should return public profile with proper structure', () => {
      const testUser = TestDataFactory.createUser();
      const result = ProfileData.getPublicProfile(testUser);

      expect(result).toEqual({
        userId: testUser.userId,
        username: testUser.username,
        displayName: testUser.displayName,
        bio: testUser.bio,
        avatar: testUser.avatar,
        followersCount: testUser.followersCount,
        followingCount: testUser.followingCount,
        postsCount: testUser.postsCount,
        isVerified: testUser.isVerified,
        isPrivate: testUser.isPrivate,
        createdAt: testUser.createdAt
      });
    });
  });

  describe('listProfiles', () => {
    it('should return profiles with pagination', async () => {
      const result = await ProfileData.listProfiles();

      expect(result).toHaveProperty('profiles');
      expect(result).toHaveProperty('lastKey');
      expect(Array.isArray(result.profiles)).toBe(true);
    });

    it('should handle custom limit parameter', async () => {
      const limit = 25;
      const result = await ProfileData.listProfiles(limit);

      expect(result.profiles).toBeDefined();
      expect(Array.isArray(result.profiles)).toBe(true);
    });

    it('should handle pagination with lastKey', async () => {
      const limit = 10;
      const lastKey = { userId: 'user-5' };

      const result = await ProfileData.listProfiles(limit, lastKey);

      expect(result.profiles).toBeDefined();
    });
  });
});