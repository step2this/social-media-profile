import { describe, test, expect } from '@jest/globals';
import { ZodError } from 'zod';
import {
  GenerateTestDataRequestSchema,
  GenerateTestDataResponseSchema,
  UserSummarySchema,
  validateGenerateTestDataRequest,
  validateGenerateTestDataResponse,
} from './admin';
// Mock faker before importing fixtures
jest.mock('@faker-js/faker', () => ({
  faker: {
    string: {
      uuid: () => 'test-uuid-123',
    },
    internet: {
      username: () => 'testuser',
    },
    person: {
      fullName: () => 'Test User',
    },
    number: {
      int: ({ min, max }: { min: number; max: number }) => min + 1,
    },
    date: {
      recent: () => new Date('2024-01-01T00:00:00.000Z'),
    },
  },
}));

import { AdminFixtures } from '../../test/fixtures/admin-fixtures';

// Test helper - single responsibility: extract Zod error path
const getZodErrorPath = (error: ZodError): string =>
  error.issues && error.issues.length > 0 ? error.issues[0].path.join('.') : '';

// Test helper - single responsibility: extract Zod error message
const getZodErrorMessage = (error: ZodError): string =>
  error.issues && error.issues.length > 0 ? error.issues[0].message : '';

// Test helper - single responsibility: expect validation success
const expectValidationSuccess = <T>(schema: any, data: unknown): T => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  return result.data;
};

// Test helper - single responsibility: expect validation failure
const expectValidationFailure = (schema: any, data: unknown, expectedPath?: string): ZodError => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);

  if (expectedPath) {
    const actualPath = getZodErrorPath(result.error);
    expect(actualPath).toBe(expectedPath);
  }

  return result.error;
};

describe('AdminSchemas', () => {
  describe('GenerateTestDataRequestSchema', () => {
    describe('when data is valid', () => {
      test('validates minimal valid request', () => {
        const data = AdminFixtures.generateTestDataRequest.minimal();
        const result = expectValidationSuccess(GenerateTestDataRequestSchema, data);

        expect(result.userCount).toBeGreaterThanOrEqual(AdminFixtures.constants.MIN_USER_COUNT);
        expect(result.postsPerUser).toBeGreaterThanOrEqual(AdminFixtures.constants.MIN_POSTS_PER_USER);
      });

      test('validates maximal valid request', () => {
        const data = AdminFixtures.generateTestDataRequest.maximal();
        const result = expectValidationSuccess(GenerateTestDataRequestSchema, data);

        expect(result.userCount).toBeLessThanOrEqual(AdminFixtures.constants.MAX_USER_COUNT);
        expect(result.postsPerUser).toBeLessThanOrEqual(AdminFixtures.constants.MAX_POSTS_PER_USER);
      });

      test('coerces string numbers to integers', () => {
        const data = { userCount: '5', postsPerUser: '3' };
        const result = expectValidationSuccess(GenerateTestDataRequestSchema, data);

        expect(result.userCount).toBe(5);
        expect(result.postsPerUser).toBe(3);
        expect(typeof result.userCount).toBe('number');
        expect(typeof result.postsPerUser).toBe('number');
      });

      test('applies default values when fields are missing', () => {
        const result = expectValidationSuccess(GenerateTestDataRequestSchema, {});

        expect(result.userCount).toBe(AdminFixtures.constants.DEFAULT_USER_COUNT);
        expect(result.postsPerUser).toBe(AdminFixtures.constants.DEFAULT_POSTS_PER_USER);
      });
    });

    describe('when data is invalid', () => {
      test('rejects userCount above maximum', () => {
        const data = AdminFixtures.generateTestDataRequest.invalid.tooManyUsers();
        expectValidationFailure(GenerateTestDataRequestSchema, data, 'userCount');
      });

      test('rejects postsPerUser above maximum', () => {
        const data = AdminFixtures.generateTestDataRequest.invalid.tooManyPosts();
        expectValidationFailure(GenerateTestDataRequestSchema, data, 'postsPerUser');
      });

      test('rejects negative userCount', () => {
        const data = AdminFixtures.generateTestDataRequest.invalid.negativeUsers();
        expectValidationFailure(GenerateTestDataRequestSchema, data, 'userCount');
      });

      test('rejects zero postsPerUser', () => {
        const data = AdminFixtures.generateTestDataRequest.invalid.zeroPosts();
        expectValidationFailure(GenerateTestDataRequestSchema, data, 'postsPerUser');
      });

      test('rejects non-numeric userCount', () => {
        const data = { userCount: 'invalid', postsPerUser: 3 };
        expectValidationFailure(GenerateTestDataRequestSchema, data, 'userCount');
      });
    });
  });

  describe('UserSummarySchema', () => {
    test('validates complete user summary', () => {
      const data = {
        userId: 'test-user-123',
        username: 'testuser',
        displayName: 'Test User',
        postsCount: 5,
      };

      const result = expectValidationSuccess(UserSummarySchema, data);
      expect(result).toEqual(data);
    });

    test('rejects missing required fields', () => {
      const data = { userId: 'test-123' }; // Missing other required fields
      expectValidationFailure(UserSummarySchema, data);
    });

    test('rejects invalid postsCount type', () => {
      const data = {
        userId: 'test-123',
        username: 'testuser',
        displayName: 'Test User',
        postsCount: 'invalid',
      };
      expectValidationFailure(UserSummarySchema, data, 'postsCount');
    });
  });

  describe('GenerateTestDataResponseSchema', () => {
    test('validates successful response', () => {
      const data = AdminFixtures.generateTestDataResponse.success();
      const result = expectValidationSuccess(GenerateTestDataResponseSchema, data);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBeTruthy();
      expect(result.body.summary.usersCreated).toBeGreaterThanOrEqual(0);
      expect(result.body.users).toBeInstanceOf(Array);
    });

    test('validates error response structure', () => {
      const data = AdminFixtures.generateTestDataResponse.error(500, 'Server error');
      const result = expectValidationSuccess(GenerateTestDataResponseSchema, data);

      expect(result.statusCode).toBe(500);
      expect(result.body.message).toBe('Server error');
    });

    test('rejects invalid status code type', () => {
      const data = {
        ...AdminFixtures.generateTestDataResponse.success(),
        statusCode: 'invalid',
      };
      expectValidationFailure(GenerateTestDataResponseSchema, data, 'statusCode');
    });

    test('rejects malformed summary object', () => {
      const data = {
        ...AdminFixtures.generateTestDataResponse.success(),
        body: {
          ...AdminFixtures.generateTestDataResponse.success().body,
          summary: 'invalid', // Should be object
        },
      };
      expectValidationFailure(GenerateTestDataResponseSchema, data, 'body.summary');
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateGenerateTestDataRequest', () => {
      test('returns parsed data for valid input', () => {
        const data = AdminFixtures.generateTestDataRequest.valid();
        const result = validateGenerateTestDataRequest(data);

        expect(result).toEqual(expect.objectContaining({
          userCount: expect.any(Number),
          postsPerUser: expect.any(Number),
        }));
      });

      test('throws ZodError for invalid input', () => {
        const data = AdminFixtures.generateTestDataRequest.invalid.tooManyUsers();

        expect(() => validateGenerateTestDataRequest(data)).toThrow(ZodError);
      });
    });

    describe('validateGenerateTestDataResponse', () => {
      test('returns parsed data for valid response', () => {
        const data = AdminFixtures.generateTestDataResponse.success();
        const result = validateGenerateTestDataResponse(data);

        expect(result.statusCode).toBe(200);
        expect(result.body).toBeDefined();
      });

      test('throws ZodError for invalid response', () => {
        const invalidData = { statusCode: 'invalid' };

        expect(() => validateGenerateTestDataResponse(invalidData)).toThrow(ZodError);
      });
    });
  });
});