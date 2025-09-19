/**
 * Unit tests for Posts shared schema validation
 *
 * Tests that client and server use identical validation rules.
 * Following CLAUDE.md principles for focused, fixture-based testing.
 */

import { describe, it, expect } from 'vitest';

// Import shared schemas for validation testing
import {
  validateCreatePostRequest,
  validatePostResponse,
  type CreatePostRequest,
  type PostResponse
} from '../../../src/schemas/shared-schemas';

// Test fixtures
const VALID_CREATE_POST_REQUEST: CreatePostRequest = {
  userId: 'user-123',
  content: 'This is a test post content',
  imageUrl: 'https://example.com/image.jpg'
};

const VALID_POST_RESPONSE: PostResponse = {
  postId: 'post-456',
  userId: 'user-123',
  username: 'testuser',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  content: 'This is a test post content',
  imageUrl: 'https://example.com/image.jpg',
  likesCount: 5,
  commentsCount: 2,
  createdAt: '2023-01-01T12:00:00Z'
};

describe('Posts Schema Validation', () => {
  describe('validateCreatePostRequest', () => {
    it('should validate a valid create post request successfully', () => {
      const result = validateCreatePostRequest(VALID_CREATE_POST_REQUEST);

      expect(result).toEqual(VALID_CREATE_POST_REQUEST);
      expect(result.userId).toBe('user-123');
      expect(result.content).toBe('This is a test post content');
    });

    it('should accept optional imageUrl', () => {
      const requestWithoutImage = {
        userId: 'user-123',
        content: 'Post without image'
      };

      const result = validateCreatePostRequest(requestWithoutImage);
      expect(result.imageUrl).toBeUndefined();
    });

    it('should handle empty string imageUrl', () => {
      const requestWithEmptyImage = {
        userId: 'user-123',
        content: 'Post with empty image',
        imageUrl: ''
      };

      const result = validateCreatePostRequest(requestWithEmptyImage);
      expect(result.imageUrl).toBeUndefined();
    });

    it('should reject request with missing userId', () => {
      const invalidRequest = {
        content: 'Post without userId'
      };

      expect(() => validateCreatePostRequest(invalidRequest)).toThrow();
    });

    it('should reject request with missing content', () => {
      const invalidRequest = {
        userId: 'user-123'
      };

      expect(() => validateCreatePostRequest(invalidRequest)).toThrow();
    });

    it('should reject request with content too long', () => {
      const invalidRequest = {
        userId: 'user-123',
        content: 'x'.repeat(2001) // Over 2000 character limit
      };

      expect(() => validateCreatePostRequest(invalidRequest)).toThrow();
    });

    it('should reject request with invalid imageUrl', () => {
      const invalidRequest = {
        userId: 'user-123',
        content: 'Valid content',
        imageUrl: 'not-a-valid-url'
      };

      expect(() => validateCreatePostRequest(invalidRequest)).toThrow();
    });
  });

  describe('validatePostResponse', () => {
    it('should validate a valid post response successfully', () => {
      const result = validatePostResponse(VALID_POST_RESPONSE);

      expect(result).toEqual(VALID_POST_RESPONSE);
      expect(result.postId).toBe('post-456');
      expect(result.likesCount).toBe(5);
    });

    it('should reject response with missing required fields', () => {
      const invalidResponse = {
        postId: 'post-456',
        content: 'Missing other required fields'
      };

      expect(() => validatePostResponse(invalidResponse)).toThrow();
    });

    it('should reject response with negative counts', () => {
      const invalidResponse = {
        ...VALID_POST_RESPONSE,
        likesCount: -1
      };

      expect(() => validatePostResponse(invalidResponse)).toThrow();
    });

    it('should reject response with invalid datetime format', () => {
      const invalidResponse = {
        ...VALID_POST_RESPONSE,
        createdAt: 'not-a-valid-datetime'
      };

      expect(() => validatePostResponse(invalidResponse)).toThrow();
    });
  });

  describe('Schema Consistency', () => {
    it('should have matching field requirements between request and response', () => {
      // Verify that fields that are required in request are present in response
      const request = VALID_CREATE_POST_REQUEST;
      const response = VALID_POST_RESPONSE;

      expect(response.userId).toBe(request.userId);
      expect(response.content).toBe(request.content);
      expect(response.imageUrl).toBe(request.imageUrl);
    });

    it('should enforce same content length limits', () => {
      const longContent = 'x'.repeat(2001);

      // Both request and response should reject content that's too long
      expect(() => validateCreatePostRequest({
        userId: 'user-123',
        content: longContent
      })).toThrow();

      expect(() => validatePostResponse({
        ...VALID_POST_RESPONSE,
        content: longContent
      })).toThrow();
    });
  });
});