/**
 * Unit tests for API client service
 *
 * Tests the functional API client using dependency injection and mocking.
 * Follows CLAUDE.md principles for isolated testing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileApi, handleApiError } from '../../../src/services/api-client';
import { VALID_PROFILE, VALID_CREATE_REQUEST, VALID_UPDATE_REQUEST } from '../../fixtures/profile-fixtures';

// Mock ky HTTP client
vi.mock('ky', () => {
  const mockKy = {
    create: vi.fn(() => mockKy),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockKy };
});

// Mock environment config
vi.mock('../../../src/config/environment', () => ({
  ENV: {
    apiUrl: 'https://test-api.example.com',
    nodeEnv: 'test',
  },
}));

describe('Profile API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('profileApi.create', () => {
    it('should create profile successfully', async () => {
      // Arrange
      const mockResponse = {
        json: vi.fn().mockResolvedValue(VALID_PROFILE),
      };

      const ky = await import('ky');
      vi.mocked(ky.default.post).mockResolvedValue(mockResponse as any);

      // Act
      const result = await profileApi.create(VALID_CREATE_REQUEST);

      // Assert
      expect(result).toEqual(VALID_PROFILE);
      expect(ky.default.post).toHaveBeenCalledWith('profiles', {
        json: VALID_CREATE_REQUEST,
      });
    });

    it('should validate response data', async () => {
      // Arrange
      const invalidResponse = { ...VALID_PROFILE, email: 'invalid-email' };
      const mockResponse = {
        json: vi.fn().mockResolvedValue(invalidResponse),
      };

      const ky = await import('ky');
      vi.mocked(ky.default.post).mockResolvedValue(mockResponse as any);

      // Act & Assert
      await expect(profileApi.create(VALID_CREATE_REQUEST)).rejects.toThrow();
    });
  });

  describe('profileApi.getById', () => {
    it('should retrieve profile by ID successfully', async () => {
      // Arrange
      const userId = 'test-user-123';
      const mockResponse = {
        json: vi.fn().mockResolvedValue(VALID_PROFILE),
      };

      const ky = await import('ky');
      vi.mocked(ky.default.get).mockResolvedValue(mockResponse as any);

      // Act
      const result = await profileApi.getById(userId);

      // Assert
      expect(result).toEqual(VALID_PROFILE);
      expect(ky.default.get).toHaveBeenCalledWith(`profiles/${userId}`, undefined);
    });
  });

  describe('profileApi.update', () => {
    it('should update profile successfully', async () => {
      // Arrange
      const userId = 'test-user-123';
      const updatedProfile = { ...VALID_PROFILE, ...VALID_UPDATE_REQUEST };
      const mockResponse = {
        json: vi.fn().mockResolvedValue(updatedProfile),
      };

      const ky = await import('ky');
      vi.mocked(ky.default.put).mockResolvedValue(mockResponse as any);

      // Act
      const result = await profileApi.update(userId, VALID_UPDATE_REQUEST);

      // Assert
      expect(result).toEqual(updatedProfile);
      expect(ky.default.put).toHaveBeenCalledWith(`profiles/${userId}`, {
        json: VALID_UPDATE_REQUEST,
      });
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors properly', async () => {
      // Arrange
      const error = new Error('HTTP 404: Not Found');
      const ky = await import('ky');
      vi.mocked(ky.default.get).mockRejectedValue(error);

      // Act & Assert
      await expect(profileApi.getById('nonexistent')).rejects.toThrow('HTTP 404: Not Found');
    });
  });
});

describe('Error Handling Utilities', () => {
  describe('handleApiError', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('API request failed');

      const result = handleApiError(error);

      expect(result).toBe('API request failed');
    });

    it('should provide default message for unknown errors', () => {
      const result = handleApiError('unknown error type');

      expect(result).toBe('An unexpected error occurred');
    });

    it('should handle null/undefined errors', () => {
      expect(handleApiError(null)).toBe('An unexpected error occurred');
      expect(handleApiError(undefined)).toBe('An unexpected error occurred');
    });
  });
});