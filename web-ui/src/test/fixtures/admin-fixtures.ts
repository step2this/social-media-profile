import { faker } from '@faker-js/faker';
import { range } from '../../shared/utils';
import {
  GenerateTestDataRequest,
  GenerateTestDataResponse,
  UserSummary,
} from '../../shared/schemas/admin';

// Constants for test data bounds - following DRY principle
const TEST_BOUNDS = {
  MIN_USER_COUNT: 1,
  MAX_USER_COUNT: 20,
  MIN_POSTS_PER_USER: 1,
  MAX_POSTS_PER_USER: 10,
  DEFAULT_USER_COUNT: 5,
  DEFAULT_POSTS_PER_USER: 3,
} as const;

// Pure function - single responsibility: create random user count within bounds
const createRandomUserCount = (): number =>
  faker.number.int({
    min: TEST_BOUNDS.MIN_USER_COUNT,
    max: TEST_BOUNDS.MAX_USER_COUNT
  });

// Pure function - single responsibility: create random posts count within bounds
const createRandomPostsCount = (): number =>
  faker.number.int({
    min: TEST_BOUNDS.MIN_POSTS_PER_USER,
    max: TEST_BOUNDS.MAX_POSTS_PER_USER
  });

// Pure function - single responsibility: create user summary
const createUserSummary = (): UserSummary => ({
  userId: faker.string.uuid(),
  username: faker.internet.username(),
  displayName: faker.person.fullName(),
  postsCount: createRandomPostsCount(),
});

// Pure function - single responsibility: create multiple user summaries
const createUserSummaries = (count: number): UserSummary[] =>
  range(count).map(() => createUserSummary());

// Pure function - single responsibility: calculate total posts
const calculateTotalPosts = (users: UserSummary[]): number =>
  users.reduce((sum, user) => sum + user.postsCount, 0);

// Factory functions for test data - following functional programming patterns
export const AdminFixtures = {
  // Generate test data request fixtures
  generateTestDataRequest: {
    valid: (): GenerateTestDataRequest => ({
      userCount: createRandomUserCount(),
      postsPerUser: createRandomPostsCount(),
    }),

    withDefaults: (): GenerateTestDataRequest => ({
      userCount: TEST_BOUNDS.DEFAULT_USER_COUNT,
      postsPerUser: TEST_BOUNDS.DEFAULT_POSTS_PER_USER,
    }),

    minimal: (): GenerateTestDataRequest => ({
      userCount: TEST_BOUNDS.MIN_USER_COUNT,
      postsPerUser: TEST_BOUNDS.MIN_POSTS_PER_USER,
    }),

    maximal: (): GenerateTestDataRequest => ({
      userCount: TEST_BOUNDS.MAX_USER_COUNT,
      postsPerUser: TEST_BOUNDS.MAX_POSTS_PER_USER,
    }),

    // For testing validation boundaries
    invalid: {
      tooManyUsers: (): Partial<GenerateTestDataRequest> => ({
        userCount: TEST_BOUNDS.MAX_USER_COUNT + 1,
        postsPerUser: TEST_BOUNDS.DEFAULT_POSTS_PER_USER,
      }),

      tooManyPosts: (): Partial<GenerateTestDataRequest> => ({
        userCount: TEST_BOUNDS.DEFAULT_USER_COUNT,
        postsPerUser: TEST_BOUNDS.MAX_POSTS_PER_USER + 1,
      }),

      negativeUsers: (): Partial<GenerateTestDataRequest> => ({
        userCount: -1,
        postsPerUser: TEST_BOUNDS.DEFAULT_POSTS_PER_USER,
      }),

      zeroPosts: (): Partial<GenerateTestDataRequest> => ({
        userCount: TEST_BOUNDS.DEFAULT_USER_COUNT,
        postsPerUser: 0,
      }),
    },
  },

  // Generate test data response fixtures
  generateTestDataResponse: {
    success: (userCount?: number, postsPerUser?: number): GenerateTestDataResponse => {
      const actualUserCount = userCount ?? TEST_BOUNDS.DEFAULT_USER_COUNT;
      const actualPostsPerUser = postsPerUser ?? TEST_BOUNDS.DEFAULT_POSTS_PER_USER;
      const users = createUserSummaries(actualUserCount);
      const totalPosts = calculateTotalPosts(users);

      return {
        statusCode: 200,
        body: {
          message: 'Test data generated successfully',
          summary: {
            usersCreated: actualUserCount,
            postsCreated: totalPosts,
            totalItems: actualUserCount + totalPosts,
          },
          users,
          timestamp: faker.date.recent().toISOString(),
        },
      };
    },

    error: (statusCode: number, message: string): Partial<GenerateTestDataResponse> => ({
      statusCode,
      body: {
        message,
        summary: {
          usersCreated: 0,
          postsCreated: 0,
          totalItems: 0,
        },
        users: [],
        timestamp: faker.date.recent().toISOString(),
      },
    }),
  },

  // HTTP response fixtures for API testing
  httpResponse: {
    success: (data: unknown): Response =>
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),

    serverError: (): Response =>
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }),

    validationError: (message: string): Response =>
      new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
  },

  // Export constants for use in tests
  constants: TEST_BOUNDS,
};