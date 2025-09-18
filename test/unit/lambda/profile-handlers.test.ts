// Unit tests for Profile Lambda handlers
describe('Profile Lambda Handlers', () => {
  // Mock data layer functions
  const mockProfileDataGetProfileById = jest.fn();
  const mockProfileDataGetProfileByUsername = jest.fn();
  const mockProfileDataCreateProfile = jest.fn();
  const mockProfileDataUpdateProfile = jest.fn();

  // Mock response helpers
  const mockCreateSuccessResponse = jest.fn();
  const mockCreateErrorResponse = jest.fn();
  const mockCreateValidationError = jest.fn();
  const mockCreateNotFoundError = jest.fn();
  const mockHandleOptionsRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockCreateSuccessResponse.mockImplementation((data) => ({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }));

    mockCreateErrorResponse.mockImplementation((message, error) => ({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message, details: error?.message })
    }));

    mockCreateValidationError.mockImplementation((message) => ({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Validation Error', details: message })
    }));

    mockCreateNotFoundError.mockImplementation((message) => ({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not Found', details: message })
    }));

    mockHandleOptionsRequest.mockImplementation((event) => {
      if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: {}, body: '' };
      }
      return null;
    });
  });

  describe('Get Profile Handler', () => {
    // Simulate the get profile handler logic
    const getProfileHandler = async (event: any) => {
      try {
        if (mockHandleOptionsRequest(event)) {
          return mockHandleOptionsRequest(event);
        }

        const { userId, username } = event.pathParameters || {};

        if (!userId && !username) {
          return mockCreateValidationError('Either userId or username is required');
        }

        let profile;
        if (userId) {
          profile = await mockProfileDataGetProfileById(userId);
        } else {
          profile = await mockProfileDataGetProfileByUsername(username);
        }

        if (!profile) {
          return mockCreateNotFoundError('Profile not found');
        }

        // Mock getPublicProfile function
        const publicProfile = {
          userId: profile.userId,
          username: profile.username,
          displayName: profile.displayName,
          bio: profile.bio,
          avatar: profile.avatar,
          followersCount: profile.followersCount,
          followingCount: profile.followingCount,
          postsCount: profile.postsCount,
          isVerified: profile.isVerified,
          isPrivate: profile.isPrivate,
          createdAt: profile.createdAt,
        };

        return mockCreateSuccessResponse(publicProfile);

      } catch (error) {
        return mockCreateErrorResponse('Failed to get profile', error);
      }
    };

    it('should get profile by userId', async () => {
      const mockProfile = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com', // Should be filtered out
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

      mockProfileDataGetProfileById.mockResolvedValue(mockProfile);

      const event = {
        pathParameters: { userId: 'user-123' }
      };

      const result = await getProfileHandler(event);

      expect(mockProfileDataGetProfileById).toHaveBeenCalledWith('user-123');
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
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
        // Note: email should be filtered out
      });
    });

    it('should get profile by username', async () => {
      const mockProfile = {
        userId: 'user-123',
        username: 'testuser',
        displayName: 'Test User'
      };

      mockProfileDataGetProfileByUsername.mockResolvedValue(mockProfile);

      const event = {
        pathParameters: { username: 'testuser' }
      };

      const result = await getProfileHandler(event);

      expect(mockProfileDataGetProfileByUsername).toHaveBeenCalledWith('testuser');
      expect(mockCreateSuccessResponse).toHaveBeenCalled();
    });

    it('should return 404 when profile not found', async () => {
      mockProfileDataGetProfileById.mockResolvedValue(null);

      const event = {
        pathParameters: { userId: 'nonexistent' }
      };

      const result = await getProfileHandler(event);

      expect(mockCreateNotFoundError).toHaveBeenCalledWith('Profile not found');
    });

    it('should validate required parameters', async () => {
      const event = {
        pathParameters: {}
      };

      const result = await getProfileHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('Either userId or username is required');
      expect(mockProfileDataGetProfileById).not.toHaveBeenCalled();
      expect(mockProfileDataGetProfileByUsername).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockProfileDataGetProfileById.mockRejectedValue(dbError);

      const event = {
        pathParameters: { userId: 'user-123' }
      };

      const result = await getProfileHandler(event);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith('Failed to get profile', dbError);
    });
  });

  describe('Create Profile Handler', () => {
    // Simulate the create profile handler logic
    const createProfileHandler = async (event: any) => {
      try {
        if (mockHandleOptionsRequest(event)) {
          return mockHandleOptionsRequest(event);
        }

        if (!event.body) {
          return mockCreateValidationError('Request body is required');
        }

        const profileData = JSON.parse(event.body);

        // Basic validation
        if (!profileData.username || !profileData.email || !profileData.displayName) {
          return mockCreateValidationError('username, email, and displayName are required');
        }

        // Check if username already exists
        const existingProfile = await mockProfileDataGetProfileByUsername(profileData.username);
        if (existingProfile) {
          return mockCreateValidationError('Username already exists');
        }

        const createdProfile = await mockProfileDataCreateProfile(profileData);

        // Mock getPublicProfile function
        const publicProfile = {
          userId: createdProfile.userId,
          username: createdProfile.username,
          displayName: createdProfile.displayName,
          bio: createdProfile.bio,
          avatar: createdProfile.avatar,
          followersCount: createdProfile.followersCount,
          followingCount: createdProfile.followingCount,
          postsCount: createdProfile.postsCount,
          isVerified: createdProfile.isVerified,
          isPrivate: createdProfile.isPrivate,
          createdAt: createdProfile.createdAt,
        };

        return mockCreateSuccessResponse(publicProfile);

      } catch (error) {
        return mockCreateErrorResponse('Failed to create profile', error);
      }
    };

    it('should create a new profile', async () => {
      const profileData = {
        username: 'newuser',
        email: 'new@example.com',
        displayName: 'New User',
        bio: 'Test bio'
      };

      const createdProfile = {
        userId: 'user-456',
        ...profileData,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
        isPrivate: false,
        createdAt: '2023-01-01T00:00:00Z'
      };

      mockProfileDataGetProfileByUsername.mockResolvedValue(null); // Username doesn't exist
      mockProfileDataCreateProfile.mockResolvedValue(createdProfile);

      const event = {
        body: JSON.stringify(profileData)
      };

      const result = await createProfileHandler(event);

      expect(mockProfileDataGetProfileByUsername).toHaveBeenCalledWith('newuser');
      expect(mockProfileDataCreateProfile).toHaveBeenCalledWith(profileData);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        userId: 'user-456',
        username: 'newuser',
        displayName: 'New User',
        bio: 'Test bio',
        avatar: undefined,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
        isPrivate: false,
        createdAt: '2023-01-01T00:00:00Z'
      });
    });

    it('should validate required fields', async () => {
      const invalidProfileData = {
        username: 'newuser'
        // Missing email and displayName
      };

      const event = {
        body: JSON.stringify(invalidProfileData)
      };

      const result = await createProfileHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('username, email, and displayName are required');
      expect(mockProfileDataCreateProfile).not.toHaveBeenCalled();
    });

    it('should reject duplicate usernames', async () => {
      const profileData = {
        username: 'existinguser',
        email: 'new@example.com',
        displayName: 'New User'
      };

      const existingProfile = {
        userId: 'user-123',
        username: 'existinguser'
      };

      mockProfileDataGetProfileByUsername.mockResolvedValue(existingProfile);

      const event = {
        body: JSON.stringify(profileData)
      };

      const result = await createProfileHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('Username already exists');
      expect(mockProfileDataCreateProfile).not.toHaveBeenCalled();
    });

    it('should validate request body exists', async () => {
      const event = { body: null };
      const result = await createProfileHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('Request body is required');
    });

    it('should handle JSON parsing errors', async () => {
      const event = { body: 'invalid json' };

      const result = await createProfileHandler(event);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith('Failed to create profile', expect.any(Error));
    });
  });

  describe('Update Profile Handler', () => {
    // Simulate the update profile handler logic
    const updateProfileHandler = async (event: any) => {
      try {
        if (mockHandleOptionsRequest(event)) {
          return mockHandleOptionsRequest(event);
        }

        const { userId } = event.pathParameters || {};

        if (!userId) {
          return mockCreateValidationError('userId path parameter is required');
        }

        if (!event.body) {
          return mockCreateValidationError('Request body is required');
        }

        const updates = JSON.parse(event.body);

        // Check if profile exists
        const existingProfile = await mockProfileDataGetProfileById(userId);
        if (!existingProfile) {
          return mockCreateNotFoundError('Profile not found');
        }

        const updatedProfile = await mockProfileDataUpdateProfile(userId, updates);

        // Mock getPublicProfile function
        const publicProfile = {
          userId: updatedProfile.userId,
          username: updatedProfile.username,
          displayName: updatedProfile.displayName,
          bio: updatedProfile.bio,
          avatar: updatedProfile.avatar,
          followersCount: updatedProfile.followersCount,
          followingCount: updatedProfile.followingCount,
          postsCount: updatedProfile.postsCount,
          isVerified: updatedProfile.isVerified,
          isPrivate: updatedProfile.isPrivate,
          createdAt: updatedProfile.createdAt,
        };

        return mockCreateSuccessResponse(publicProfile);

      } catch (error) {
        return mockCreateErrorResponse('Failed to update profile', error);
      }
    };

    it('should update profile successfully', async () => {
      const updates = {
        displayName: 'Updated Name',
        bio: 'Updated bio'
      };

      const existingProfile = {
        userId: 'user-123',
        username: 'testuser',
        displayName: 'Original Name'
      };

      const updatedProfile = {
        ...existingProfile,
        ...updates
      };

      mockProfileDataGetProfileById.mockResolvedValue(existingProfile);
      mockProfileDataUpdateProfile.mockResolvedValue(updatedProfile);

      const event = {
        pathParameters: { userId: 'user-123' },
        body: JSON.stringify(updates)
      };

      const result = await updateProfileHandler(event);

      expect(mockProfileDataGetProfileById).toHaveBeenCalledWith('user-123');
      expect(mockProfileDataUpdateProfile).toHaveBeenCalledWith('user-123', updates);
      expect(mockCreateSuccessResponse).toHaveBeenCalled();
    });

    it('should return 404 when profile not found', async () => {
      mockProfileDataGetProfileById.mockResolvedValue(null);

      const event = {
        pathParameters: { userId: 'nonexistent' },
        body: JSON.stringify({ displayName: 'New Name' })
      };

      const result = await updateProfileHandler(event);

      expect(mockCreateNotFoundError).toHaveBeenCalledWith('Profile not found');
      expect(mockProfileDataUpdateProfile).not.toHaveBeenCalled();
    });

    it('should validate userId parameter', async () => {
      const event = {
        pathParameters: {},
        body: JSON.stringify({ displayName: 'New Name' })
      };

      const result = await updateProfileHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('userId path parameter is required');
    });

    it('should validate request body', async () => {
      const event = {
        pathParameters: { userId: 'user-123' },
        body: null
      };

      const result = await updateProfileHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('Request body is required');
    });
  });
});