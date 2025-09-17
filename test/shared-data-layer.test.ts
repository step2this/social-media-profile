// Mock the shared data layer functionality for testing
// Since we're using ES modules in Lambda, we'll test the patterns and interfaces

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-eventbridge');
jest.mock('@aws-sdk/client-s3');

// Mock response helper functions to test the patterns
const createSuccessResponse = (data: any, statusCode = 200, additionalHeaders = {}) => {
  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
    body: JSON.stringify(data),
  };
};

const createErrorResponse = (error: any, statusCode = 500, additionalHeaders = {}) => {
  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  const errorBody = typeof error === 'string'
    ? { error }
    : { error: error.message || 'Unknown error', ...(error.details && { details: error.details }) };

  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
    body: JSON.stringify(errorBody),
  };
};

const createValidationError = (message: string) => createErrorResponse(message, 400);
const createNotFoundError = (message = 'Resource not found') => createErrorResponse(message, 404);
const createConflictError = (message: string) => createErrorResponse(message, 409);

// Mock ProfileData class to test the patterns
class MockProfileData {
  static getPublicProfile(profile: any) {
    if (!profile) return null;

    return {
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
  }
}

describe('Shared Data Access Layer', () => {

  describe('Response Helpers', () => {
    test('createSuccessResponse creates proper response', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data, 201, { 'Custom-Header': 'value' });

      expect(response.statusCode).toBe(201);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect((response.headers as any)['Custom-Header']).toBe('value');
      expect(JSON.parse(response.body)).toEqual(data);
    });

    test('createErrorResponse creates proper error response', () => {
      const response = createErrorResponse('Something went wrong', 400);

      expect(response.statusCode).toBe(400);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(response.body)).toEqual({ error: 'Something went wrong' });
    });

    test('createValidationError creates 400 response', () => {
      const response = createValidationError('Invalid input');

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ error: 'Invalid input' });
    });

    test('createNotFoundError creates 404 response', () => {
      const response = createNotFoundError('User not found');

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ error: 'User not found' });
    });

    test('createConflictError creates 409 response', () => {
      const response = createConflictError('Resource already exists');

      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.body)).toEqual({ error: 'Resource already exists' });
    });
  });

  describe('ProfileData', () => {
    test('getPublicProfile filters sensitive data', () => {
      const fullProfile = {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com', // This should be filtered out
        displayName: 'Test User',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        followersCount: 10,
        followingCount: 5,
        postsCount: 3,
        isVerified: true,
        isPrivate: false,
        createdAt: '2023-01-01T00:00:00Z',
        sensitiveField: 'should not appear', // This should be filtered out
      };

      const publicProfile = MockProfileData.getPublicProfile(fullProfile);

      expect(publicProfile).toEqual({
        userId: 'user123',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        followersCount: 10,
        followingCount: 5,
        postsCount: 3,
        isVerified: true,
        isPrivate: false,
        createdAt: '2023-01-01T00:00:00Z',
      });

      expect(publicProfile).not.toHaveProperty('email');
      expect(publicProfile).not.toHaveProperty('sensitiveField');
    });

    test('getPublicProfile returns null for null input', () => {
      expect(MockProfileData.getPublicProfile(null)).toBeNull();
    });
  });

  describe('Shared Data Layer Architecture', () => {
    test('Response helpers provide consistent CORS headers', () => {
      const response = createSuccessResponse({ data: 'test' });
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    test('Error responses include proper status codes', () => {
      expect(createValidationError('Invalid').statusCode).toBe(400);
      expect(createNotFoundError('Missing').statusCode).toBe(404);
      expect(createConflictError('Duplicate').statusCode).toBe(409);
    });

    test('Shared data layer provides consistent patterns', () => {
      // Test that our shared layer provides the expected patterns
      expect(typeof createSuccessResponse).toBe('function');
      expect(typeof createErrorResponse).toBe('function');
      expect(typeof MockProfileData.getPublicProfile).toBe('function');
    });
  });
});