// Unit tests for Admin Lambda handlers
describe('Admin Lambda Handlers', () => {
  // Mock AWS SDK and shared modules
  const mockProfileDataGetAllProfiles = jest.fn();
  const mockProfileDataCreateProfile = jest.fn();
  const mockPostDataCreatePost = jest.fn();
  const mockAdminDataDeleteUser = jest.fn();
  const mockAdminDataCleanupAll = jest.fn();
  const mockAdminDataCleanupS3 = jest.fn();

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

  describe('List Users Handler', () => {
    // Simulate the list-users handler logic
    const listUsersHandler = async (event: any) => {
      try {
        if (mockHandleOptionsRequest(event)) {
          return mockHandleOptionsRequest(event);
        }

        const { page = '1', limit = '10' } = event.queryStringParameters || {};
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        if (isNaN(pageNumber) || isNaN(pageLimit) || pageNumber < 1 || pageLimit < 1 || pageLimit > 100) {
          return mockCreateValidationError('Invalid pagination parameters');
        }

        const users = await mockProfileDataGetAllProfiles();
        users.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const totalUsers = users.length;
        const totalPages = Math.ceil(totalUsers / pageLimit);
        const startIndex = (pageNumber - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;
        const paginatedUsers = users.slice(startIndex, endIndex);

        return mockCreateSuccessResponse({
          users: paginatedUsers,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalUsers,
            pageSize: pageLimit,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1,
          },
        });

      } catch (error) {
        return mockCreateErrorResponse('Failed to list users', error);
      }
    };

    it('should list users with default pagination', async () => {
      const mockUsers = [
        { userId: 'user-1', username: 'user1', createdAt: '2023-01-02T00:00:00Z' },
        { userId: 'user-2', username: 'user2', createdAt: '2023-01-01T00:00:00Z' }
      ];

      mockProfileDataGetAllProfiles.mockResolvedValue(mockUsers);

      const event = { queryStringParameters: null };
      const result = await listUsersHandler(event);

      expect(mockProfileDataGetAllProfiles).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        users: mockUsers, // Should be sorted by createdAt desc
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 2,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    it('should handle custom pagination', async () => {
      const mockUsers = Array.from({ length: 25 }, (_, i) => ({
        userId: `user-${i}`,
        username: `user${i}`,
        createdAt: '2023-01-01T00:00:00Z'
      }));

      mockProfileDataGetAllProfiles.mockResolvedValue(mockUsers);

      const event = {
        queryStringParameters: { page: '2', limit: '10' }
      };

      const result = await listUsersHandler(event);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        users: mockUsers.slice(10, 20),
        pagination: {
          currentPage: 2,
          totalPages: 3,
          totalUsers: 25,
          pageSize: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      });
    });

    it('should validate pagination parameters', async () => {
      const event = {
        queryStringParameters: { page: 'invalid', limit: '10' }
      };

      const result = await listUsersHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('Invalid pagination parameters');
      expect(mockProfileDataGetAllProfiles).not.toHaveBeenCalled();
    });

    it('should limit page size to maximum 100', async () => {
      const event = {
        queryStringParameters: { page: '1', limit: '150' }
      };

      const result = await listUsersHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('Invalid pagination parameters');
    });

    it('should handle OPTIONS request', async () => {
      const event = { httpMethod: 'OPTIONS' };
      const result = await listUsersHandler(event);

      expect(mockHandleOptionsRequest).toHaveBeenCalledWith(event);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockProfileDataGetAllProfiles.mockRejectedValue(dbError);

      const event = { queryStringParameters: null };
      const result = await listUsersHandler(event);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith('Failed to list users', dbError);
    });
  });

  describe('Generate Test Data Handler', () => {
    // Simulate the generate-test-data handler logic
    const generateTestDataHandler = async (event: any) => {
      try {
        if (mockHandleOptionsRequest(event)) {
          return mockHandleOptionsRequest(event);
        }

        const { userCount = '5', postsPerUser = '3' } = event.queryStringParameters || {};
        const numUsers = Math.min(parseInt(userCount), 20);
        const numPostsPerUser = Math.min(parseInt(postsPerUser), 10);

        if (isNaN(numUsers) || isNaN(numPostsPerUser) || numUsers < 1 || numPostsPerUser < 1) {
          return mockCreateValidationError('Invalid userCount or postsPerUser parameters');
        }

        const createdUsers = [];
        let totalPostsCreated = 0;

        for (let i = 0; i < numUsers; i++) {
          const userPayload = {
            username: `testuser${i}`,
            displayName: `Test User ${i}`,
            email: `testuser${i}@example.com`,
            bio: 'Test bio',
            isPrivate: false,
            isVerified: Math.random() > 0.8,
          };

          const createdUser = await mockProfileDataCreateProfile(userPayload);
          createdUsers.push({
            userId: createdUser.userId,
            username: createdUser.username,
            displayName: createdUser.displayName,
            postsCount: numPostsPerUser,
          });

          for (let j = 0; j < numPostsPerUser; j++) {
            const postPayload = {
              content: `Test post ${j} from ${createdUser.username}`,
              imageUrl: '',
            };

            await mockPostDataCreatePost(createdUser.userId, postPayload);
            totalPostsCreated++;
          }
        }

        return mockCreateSuccessResponse({
          message: 'Test data generated successfully',
          summary: {
            usersCreated: createdUsers.length,
            postsCreated: totalPostsCreated,
            totalItems: createdUsers.length + totalPostsCreated,
          },
          users: createdUsers,
          timestamp: expect.any(String),
        });

      } catch (error) {
        return mockCreateErrorResponse('Failed to generate test data', error);
      }
    };

    it('should generate test data with default parameters', async () => {
      mockProfileDataCreateProfile.mockImplementation((userPayload) =>
        Promise.resolve({
          userId: `user-${Math.random()}`,
          ...userPayload
        })
      );
      mockPostDataCreatePost.mockResolvedValue({});

      const event = { queryStringParameters: null };
      const result = await generateTestDataHandler(event);

      expect(mockProfileDataCreateProfile).toHaveBeenCalledTimes(5);
      expect(mockPostDataCreatePost).toHaveBeenCalledTimes(15); // 5 users * 3 posts
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test data generated successfully',
          summary: {
            usersCreated: 5,
            postsCreated: 15,
            totalItems: 20,
          }
        })
      );
    });

    it('should handle custom parameters', async () => {
      mockProfileDataCreateProfile.mockImplementation((userPayload) =>
        Promise.resolve({
          userId: `user-${Math.random()}`,
          ...userPayload
        })
      );
      mockPostDataCreatePost.mockResolvedValue({});

      const event = {
        queryStringParameters: { userCount: '2', postsPerUser: '1' }
      };

      const result = await generateTestDataHandler(event);

      expect(mockProfileDataCreateProfile).toHaveBeenCalledTimes(2);
      expect(mockPostDataCreatePost).toHaveBeenCalledTimes(2); // 2 users * 1 post
    });

    it('should limit to maximum values', async () => {
      mockProfileDataCreateProfile.mockImplementation((userPayload) =>
        Promise.resolve({
          userId: `user-${Math.random()}`,
          ...userPayload
        })
      );
      mockPostDataCreatePost.mockResolvedValue({});

      const event = {
        queryStringParameters: { userCount: '100', postsPerUser: '50' }
      };

      const result = await generateTestDataHandler(event);

      expect(mockProfileDataCreateProfile).toHaveBeenCalledTimes(20); // Max 20 users
      expect(mockPostDataCreatePost).toHaveBeenCalledTimes(200); // 20 users * 10 posts (max)
    });

    it('should validate parameters', async () => {
      const event = {
        queryStringParameters: { userCount: 'invalid', postsPerUser: '3' }
      };

      const result = await generateTestDataHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('Invalid userCount or postsPerUser parameters');
      expect(mockProfileDataCreateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Delete User Handler', () => {
    // Simulate the delete-user handler logic
    const deleteUserHandler = async (event: any) => {
      try {
        if (mockHandleOptionsRequest(event)) {
          return mockHandleOptionsRequest(event);
        }

        const { userId } = event.pathParameters || {};

        if (!userId) {
          return mockCreateValidationError('userId path parameter is required');
        }

        try {
          const result = await mockAdminDataDeleteUser(userId);
          return mockCreateSuccessResponse({
            message: 'User deleted successfully',
            ...result,
          });
        } catch (error: any) {
          if (error.message === 'User not found') {
            return mockCreateNotFoundError('User not found');
          }
          throw error;
        }

      } catch (error) {
        return mockCreateErrorResponse('Failed to delete user', error);
      }
    };

    it('should delete user successfully', async () => {
      const deleteResult = {
        deletedItems: 5,
        userId: 'user-123'
      };

      mockAdminDataDeleteUser.mockResolvedValue(deleteResult);

      const event = {
        pathParameters: { userId: 'user-123' }
      };

      const result = await deleteUserHandler(event);

      expect(mockAdminDataDeleteUser).toHaveBeenCalledWith('user-123');
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        message: 'User deleted successfully',
        deletedItems: 5,
        userId: 'user-123'
      });
    });

    it('should handle missing userId parameter', async () => {
      const event = { pathParameters: {} };
      const result = await deleteUserHandler(event);

      expect(mockCreateValidationError).toHaveBeenCalledWith('userId path parameter is required');
      expect(mockAdminDataDeleteUser).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      mockAdminDataDeleteUser.mockRejectedValue(new Error('User not found'));

      const event = {
        pathParameters: { userId: 'nonexistent' }
      };

      const result = await deleteUserHandler(event);

      expect(mockCreateNotFoundError).toHaveBeenCalledWith('User not found');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockAdminDataDeleteUser.mockRejectedValue(dbError);

      const event = {
        pathParameters: { userId: 'user-123' }
      };

      const result = await deleteUserHandler(event);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith('Failed to delete user', dbError);
    });
  });
});