/**
 * Unit tests for profile schemas
 *
 * Tests Zod validation schemas following CLAUDE.md principles.
 * Each test validates one specific behavior using fixtures.
 */

import { describe, it, expect } from 'vitest';
import {
  validateProfileResponse,
  validateCreateRequest,
  validateUpdateRequest,
  validateApiError
} from '../../../src/schemas/shared-schemas';
import {
  VALID_PROFILE,
  VALID_CREATE_REQUEST,
  VALID_UPDATE_REQUEST,
  INVALID_PROFILE_DATA,
  API_ERROR_FIXTURES
} from '../../fixtures/profile-fixtures';

describe('Profile Schema Validation', () => {
  describe('validateProfileResponse', () => {
    it('should validate a valid profile response successfully', () => {
      // Arrange-Act-Assert pattern
      const result = validateProfileResponse(VALID_PROFILE);

      expect(result).toEqual(VALID_PROFILE);
      expect(result.userId).toBe('test-user-123');
      expect(result.followersCount).toBe(42);
    });

    it('should reject profile response with missing required fields', () => {
      expect(() => validateProfileResponse({})).toThrow();
      expect(() => validateProfileResponse({ username: 'test' })).toThrow();
    });

    it('should reject profile response with negative counts', () => {
      const invalidProfile = { ...VALID_PROFILE, followersCount: -1 };

      expect(() => validateProfileResponse(invalidProfile)).toThrow();
    });
  });

  describe('validateCreateRequest', () => {
    it('should validate a valid create request successfully', () => {
      const result = validateCreateRequest(VALID_CREATE_REQUEST);

      expect(result).toEqual(VALID_CREATE_REQUEST);
      expect(result.username).toBe('newuser');
    });

    it('should reject create request with missing username', () => {
      expect(() => validateCreateRequest(INVALID_PROFILE_DATA.missingUsername)).toThrow();
    });

    it('should reject create request with invalid email', () => {
      expect(() => validateCreateRequest(INVALID_PROFILE_DATA.invalidEmail)).toThrow();
    });

    it('should reject create request with bio too long', () => {
      expect(() => validateCreateRequest(INVALID_PROFILE_DATA.tooLongBio)).toThrow();
    });

    it('should allow optional fields to be omitted', () => {
      const minimalRequest = {
        username: 'test',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const result = validateCreateRequest(minimalRequest);
      expect(result.bio).toBeUndefined();
      expect(result.avatar).toBeUndefined();
    });
  });

  describe('validateUpdateRequest', () => {
    it('should validate a valid update request successfully', () => {
      const result = validateUpdateRequest(VALID_UPDATE_REQUEST);

      expect(result).toEqual(VALID_UPDATE_REQUEST);
      expect(result.isPrivate).toBe(true);
    });

    it('should allow empty update request', () => {
      const result = validateUpdateRequest({});

      expect(result).toEqual({});
    });

    it('should reject update with bio too long', () => {
      const invalidUpdate = { bio: 'x'.repeat(501) };

      expect(() => validateUpdateRequest(invalidUpdate)).toThrow();
    });

    it('should reject update with invalid avatar URL', () => {
      const invalidUpdate = { avatar: 'not-a-url' };

      expect(() => validateUpdateRequest(invalidUpdate)).toThrow();
    });
  });

  describe('validateApiError', () => {
    it('should validate API error responses', () => {
      const result = validateApiError(API_ERROR_FIXTURES.notFound);

      expect(result.error).toBe('Not Found');
      expect(result.details).toBe('Profile not found');
    });

    it('should validate API error without details', () => {
      const simpleError = { error: 'Something went wrong' };

      const result = validateApiError(simpleError);
      expect(result.error).toBe('Something went wrong');
      expect(result.details).toBeUndefined();
    });

    it('should reject API error without error field', () => {
      expect(() => validateApiError({})).toThrow();
      expect(() => validateApiError({ details: 'Missing error field' })).toThrow();
    });
  });
});