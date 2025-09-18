import { ProfileData } from '../../lambda/shared/profile-data';
import { GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Mock the AWS SDK
const mockSend = jest.fn();
jest.mock('../../lambda/shared/clients', () => ({
  docClient: {
    send: mockSend
  },
  TABLE_NAME: 'test-table'
}));

describe('ProfileData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfileById', () => {
    it('should retrieve a profile by user ID', async () => {
      const mockProfile = {
        userId: 'user-123',
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com'
      };

      mockSend.mockResolvedValue({ Item: mockProfile });

      const result = await ProfileData.getProfileById('user-123');

      expect(mockSend).toHaveBeenCalledWith(expect.any(GetCommand));
      expect(result).toEqual(mockProfile);
    });

    it('should return undefined when profile not found', async () => {
      mockSend.mockResolvedValue({ Item: undefined });

      const result = await ProfileData.getProfileById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getProfileByUsername', () => {
    it('should retrieve a profile by username', async () => {
      const mockProfile = {
        userId: 'user-123',
        username: 'testuser',
        displayName: 'Test User'
      };

      mockSend.mockResolvedValue({ Items: [mockProfile] });

      const result = await ProfileData.getProfileByUsername('testuser');

      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(result).toEqual(mockProfile);
    });

    it('should return undefined when username not found', async () => {
      mockSend.mockResolvedValue({ Items: [] });

      const result = await ProfileData.getProfileByUsername('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('createProfile', () => {
    it('should create a new profile with generated userId', async () => {
      const profileData = {
        username: 'newuser',
        email: 'new@example.com',
        displayName: 'New User',
        bio: 'Test bio'
      };

      mockSend.mockResolvedValue({});

      const result = await ProfileData.createProfile(profileData);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
      expect(result).toMatchObject({
        username: 'newuser',
        email: 'new@example.com',
        displayName: 'New User',
        bio: 'Test bio',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
        isPrivate: false
      });
      expect(result.userId).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create a profile with provided userId', async () => {
      const profileData = {
        userId: 'custom-user-id',
        username: 'existinguser',
        email: 'existing@example.com',
        displayName: 'Existing User'
      };

      mockSend.mockResolvedValue({});

      const result = await ProfileData.createProfile(profileData);

      expect(result.userId).toBe('custom-user-id');
    });

    it('should set custom isVerified and isPrivate flags', async () => {
      const profileData = {
        username: 'verifieduser',
        email: 'verified@example.com',
        displayName: 'Verified User',
        isVerified: true,
        isPrivate: true
      };

      mockSend.mockResolvedValue({});

      const result = await ProfileData.createProfile(profileData);

      expect(result.isVerified).toBe(true);
      expect(result.isPrivate).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      const updates = {
        displayName: 'Updated Name',
        bio: 'Updated bio'
      };

      const updatedProfile = {
        userId: 'user-123',
        username: 'testuser',
        displayName: 'Updated Name',
        bio: 'Updated bio',
        updatedAt: expect.any(String)
      };

      mockSend.mockResolvedValue({ Attributes: updatedProfile });

      const result = await ProfileData.updateProfile('user-123', updates);

      expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
      expect(result).toEqual(updatedProfile);
    });

    it('should not allow updating userId', async () => {
      const updates = {
        userId: 'different-id',
        displayName: 'Updated Name'
      };

      mockSend.mockResolvedValue({ Attributes: {} });

      await ProfileData.updateProfile('user-123', updates);

      const updateCommand = mockSend.mock.calls[0][0];
      expect(updateCommand.input.ExpressionAttributeNames).not.toHaveProperty('#userId');
    });
  });

  describe('updateProfileCounters', () => {
    it('should update profile counters', async () => {
      const counters = {
        followersCount: 1,
        postsCount: 1
      };

      mockSend.mockResolvedValue({});

      await ProfileData.updateProfileCounters('user-123', counters);

      expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
      const updateCommand = mockSend.mock.calls[0][0];
      expect(updateCommand.input.UpdateExpression).toContain('ADD');
    });
  });

  describe('getAllProfiles', () => {
    it('should return all profiles', async () => {
      const mockProfiles = [
        { userId: 'user-1', username: 'user1' },
        { userId: 'user-2', username: 'user2' }
      ];

      mockSend.mockResolvedValue({ Items: mockProfiles });

      const result = await ProfileData.getAllProfiles();

      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));
      expect(result).toEqual(mockProfiles);
    });

    it('should return empty array when no profiles exist', async () => {
      mockSend.mockResolvedValue({ Items: undefined });

      const result = await ProfileData.getAllProfiles();

      expect(result).toEqual([]);
    });
  });

  describe('getPublicProfile', () => {
    it('should return public profile data', () => {
      const fullProfile = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com', // This should be filtered out
        displayName: 'Test User',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        followersCount: 10,
        followingCount: 5,
        postsCount: 20,
        isVerified: true,
        isPrivate: false,
        createdAt: '2023-01-01T00:00:00Z'
      };

      const result = ProfileData.getPublicProfile(fullProfile);

      expect(result).toEqual({
        userId: 'user-123',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        followersCount: 10,
        followingCount: 5,
        postsCount: 20,
        isVerified: true,
        isPrivate: false,
        createdAt: '2023-01-01T00:00:00Z'
      });
      expect(result).not.toHaveProperty('email');
    });

    it('should return null for null input', () => {
      const result = ProfileData.getPublicProfile(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = ProfileData.getPublicProfile(undefined);
      expect(result).toBeNull();
    });
  });
});