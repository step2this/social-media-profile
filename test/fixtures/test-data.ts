/**
 * Centralized Test Data Factory
 *
 * Pure data objects with no dependencies - perfect for unit testing.
 * Creates consistent, reusable test data across all test files.
 */

export interface TestUser {
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
  updatedAt?: string;
}

export interface TestPost {
  postId: string;
  userId: string;
  content: string;
  mediaCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface TestPagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Test Data Factory - Creates clean, consistent test data
 */
export class TestDataFactory {

  static createUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      userId: 'user-123',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      bio: 'A test user for unit testing',
      avatar: 'https://example.com/avatar.jpg',
      followersCount: 10,
      followingCount: 5,
      postsCount: 20,
      isVerified: false,
      isPrivate: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  static createUsers(count: number): TestUser[] {
    return Array.from({ length: count }, (_, i) =>
      this.createUser({
        userId: `user-${i + 1}`,
        username: `user${i + 1}`,
        displayName: `User ${i + 1}`,
        email: `user${i + 1}@example.com`
      })
    );
  }

  static createPost(overrides: Partial<TestPost> = {}): TestPost {
    return {
      postId: 'post-123',
      userId: 'user-123',
      content: 'This is a test post for unit testing',
      mediaCount: 1,
      likesCount: 5,
      commentsCount: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  static createPagination(overrides: Partial<TestPagination> = {}): TestPagination {
    return {
      currentPage: 1,
      totalPages: 1,
      totalUsers: 1,
      pageSize: 50,
      hasNextPage: false,
      hasPreviousPage: false,
      ...overrides
    };
  }

  static createApiResponse(data: any, statusCode: number = 200) {
    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  }

  static createErrorResponse(message: string, statusCode: number = 500) {
    return this.createApiResponse({
      message,
      error: 'Test error'
    }, statusCode);
  }

  static createLambdaEvent(overrides: any = {}) {
    return {
      httpMethod: 'GET',
      path: '/test',
      pathParameters: null,
      queryStringParameters: null,
      headers: {
        'Content-Type': 'application/json'
      },
      body: null,
      isBase64Encoded: false,
      ...overrides
    };
  }

  // DynamoDB Test Data (for integration tests only)
  static createDynamoItem(pk: string, sk: string, data: any = {}) {
    return {
      PK: pk,
      SK: sk,
      ...data,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };
  }

  static createUserDynamoItem(userId: string, userData: Partial<TestUser> = {}) {
    const user = this.createUser({ userId, ...userData });
    return this.createDynamoItem(`USER#${userId}`, 'PROFILE', user);
  }
}