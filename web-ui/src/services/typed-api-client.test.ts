import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { compose } from '../shared/utils';
import { typedApiClient, TypedApiClient } from './typed-api-client';
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

// Mock the config module
jest.mock('../shared/config', () => ({
  ServiceConfig: {
    getApiUrl: () => 'https://test-api.example.com/prod',
  },
}));

import { AdminFixtures } from '../test/fixtures/admin-fixtures';

// Test constants - following DRY principle
const TEST_CONFIG = {
  API_BASE_URL: 'https://test-api.example.com/prod',
  ENDPOINTS: {
    GENERATE_TEST_DATA: '/admin/test-data',
  },
} as const;

// Test helper - single responsibility: create mock fetch response
const createMockResponse = (data: unknown, status = 200): Response =>
  AdminFixtures.httpResponse.success(data);

// Test helper - single responsibility: create mock fetch error
const createMockError = (status: number, message: string): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Test helper - single responsibility: setup fetch mock
const setupFetchMock = (response: Response): jest.MockedFunction<typeof fetch> => {
  const mockFetch = jest.fn(() => Promise.resolve(response)) as jest.MockedFunction<typeof fetch>;
  global.fetch = mockFetch;
  return mockFetch;
};

// Test helper - single responsibility: verify fetch was called correctly
const expectFetchCalledWith = (
  mockFetch: jest.MockedFunction<typeof fetch>,
  expectedUrl: string,
  expectedOptions: RequestInit
): void => {
  expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expectedOptions);
};

// Test helper - single responsibility: create expected request options
const createExpectedRequestOptions = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(body && { body: JSON.stringify(body) }),
});

describe('TypedApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Construction and Structure', () => {
    test('exports singleton instance', () => {
      expect(typedApiClient).toBeInstanceOf(TypedApiClient);
    });

    test('has admin namespace with expected methods', () => {
      expect(typedApiClient.admin).toBeDefined();
      expect(typeof typedApiClient.admin.generateTestData).toBe('function');
    });
  });

  describe('admin.generateTestData', () => {
    describe('when API returns success', () => {
      test('makes correct HTTP request with query parameters', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.withDefaults();
        const responseData = AdminFixtures.generateTestDataResponse.success();
        const mockFetch = setupFetchMock(createMockResponse(responseData));

        const expectedUrl = `${TEST_CONFIG.API_BASE_URL}${TEST_CONFIG.ENDPOINTS.GENERATE_TEST_DATA}?userCount=${requestData.userCount}&postsPerUser=${requestData.postsPerUser}`;
        const expectedOptions = createExpectedRequestOptions('POST', {});

        // Act
        const result = await typedApiClient.admin.generateTestData(requestData);

        // Assert
        expectFetchCalledWith(mockFetch, expectedUrl, expectedOptions);
        expect(result).toEqual(responseData);
      });

      test('handles minimal parameters correctly', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.minimal();
        const responseData = AdminFixtures.generateTestDataResponse.success(
          requestData.userCount,
          requestData.postsPerUser
        );
        const mockFetch = setupFetchMock(createMockResponse(responseData));

        // Act
        const result = await typedApiClient.admin.generateTestData(requestData);

        // Assert
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result.body.summary.usersCreated).toBe(requestData.userCount);
      });

      test('handles maximal parameters correctly', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.maximal();
        const responseData = AdminFixtures.generateTestDataResponse.success(
          requestData.userCount,
          requestData.postsPerUser
        );
        const mockFetch = setupFetchMock(createMockResponse(responseData));

        // Act
        const result = await typedApiClient.admin.generateTestData(requestData);

        // Assert
        expect(result.body.summary.usersCreated).toBe(requestData.userCount);
        expect(result.body.users).toHaveLength(requestData.userCount);
      });

      test('validates response schema automatically', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.valid();
        const responseData = AdminFixtures.generateTestDataResponse.success();
        setupFetchMock(createMockResponse(responseData));

        // Act
        const result = await typedApiClient.admin.generateTestData(requestData);

        // Assert - Schema validation happens automatically, no throw means success
        expect(result.statusCode).toBe(200);
        expect(result.body.message).toBeTruthy();
        expect(Array.isArray(result.body.users)).toBe(true);
      });
    });

    describe('when API returns error', () => {
      test('throws descriptive error for HTTP 4xx errors', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.valid();
        const errorMessage = 'Invalid request parameters';
        const mockFetch = setupFetchMock(createMockError(400, errorMessage));

        // Act & Assert
        await expect(typedApiClient.admin.generateTestData(requestData))
          .rejects
          .toThrow(`API Error 400: ${errorMessage}`);
      });

      test('throws descriptive error for HTTP 5xx errors', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.valid();
        const mockFetch = setupFetchMock(AdminFixtures.httpResponse.serverError());

        // Act & Assert
        await expect(typedApiClient.admin.generateTestData(requestData))
          .rejects
          .toThrow('API Error 502: Internal server error');
      });

      test('throws error for network failures', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.valid();
        const mockFetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.MockedFunction<typeof fetch>;
        global.fetch = mockFetch;

        // Act & Assert
        await expect(typedApiClient.admin.generateTestData(requestData))
          .rejects
          .toThrow('Network error');
      });

      test('throws error for invalid response schema', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.valid();
        const invalidResponse = { invalid: 'response structure' };
        const mockFetch = setupFetchMock(createMockResponse(invalidResponse));

        // Act & Assert
        await expect(typedApiClient.admin.generateTestData(requestData))
          .rejects
          .toThrow(); // Zod validation error
      });
    });

    describe('request construction', () => {
      test('properly encodes query parameters', async () => {
        // Arrange
        const requestData = {
          userCount: 15,
          postsPerUser: 8,
        };
        const responseData = AdminFixtures.generateTestDataResponse.success();
        const mockFetch = setupFetchMock(createMockResponse(responseData));

        // Act
        await typedApiClient.admin.generateTestData(requestData);

        // Assert
        const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
        expect(calledUrl).toContain('userCount=15');
        expect(calledUrl).toContain('postsPerUser=8');
      });

      test('sends correct content-type header', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.valid();
        const responseData = AdminFixtures.generateTestDataResponse.success();
        const mockFetch = setupFetchMock(createMockResponse(responseData));

        // Act
        await typedApiClient.admin.generateTestData(requestData);

        // Assert
        const calledOptions = mockFetch.mock.calls[0]?.[1] as RequestInit;
        expect(calledOptions.headers).toEqual(
          expect.objectContaining({
            'Content-Type': 'application/json',
          })
        );
      });

      test('uses POST method with empty body', async () => {
        // Arrange
        const requestData = AdminFixtures.generateTestDataRequest.valid();
        const responseData = AdminFixtures.generateTestDataResponse.success();
        const mockFetch = setupFetchMock(createMockResponse(responseData));

        // Act
        await typedApiClient.admin.generateTestData(requestData);

        // Assert
        const calledOptions = mockFetch.mock.calls[0]?.[1] as RequestInit;
        expect(calledOptions.method).toBe('POST');
        expect(calledOptions.body).toBe('{}');
      });
    });
  });

  describe('Error Handling Patterns', () => {
    test('preserves error context for debugging', async () => {
      // Arrange
      const requestData = AdminFixtures.generateTestDataRequest.valid();
      const errorResponse = new Response(
        JSON.stringify({ error: 'Validation failed', details: { field: 'userCount' } }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
      setupFetchMock(errorResponse);

      // Act & Assert
      try {
        await typedApiClient.admin.generateTestData(requestData);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('422');
        expect((error as Error).message).toContain('Validation failed');
      }
    });

    test('handles empty error responses gracefully', async () => {
      // Arrange
      const requestData = AdminFixtures.generateTestDataRequest.valid();
      const errorResponse = new Response('', { status: 500 });
      setupFetchMock(errorResponse);

      // Act & Assert
      await expect(typedApiClient.admin.generateTestData(requestData))
        .rejects
        .toThrow('API Error 500: Unknown error');
    });
  });
});