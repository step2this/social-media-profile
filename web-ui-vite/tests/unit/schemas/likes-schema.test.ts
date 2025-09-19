/**
 * Unit tests for Likes shared schema validation
 *
 * Tests that client and server use identical validation rules.
 * Following CLAUDE.md principles for focused, fixture-based testing.
 */

import { describe, it, expect } from 'vitest';

// Import shared schemas for validation testing
import {
  validateLikePostRequest,
  validateUnlikePostRequest,
  validateLikeStatusResponse,
  validateLikeActionResponse,
  type LikePostRequest,
  type UnlikePostRequest,
  type LikeStatusResponse,
  type LikeActionResponse
} from '../../../src/schemas/shared-schemas';

// Test fixtures
const VALID_LIKE_REQUEST: LikePostRequest = {
  userId: 'user-123',
  postId: 'post-456',
};

const VALID_UNLIKE_REQUEST: UnlikePostRequest = {
  userId: 'user-123',
  postId: 'post-456',
};

const VALID_LIKE_STATUS_RESPONSE: LikeStatusResponse = {
  isLiked: true,
  likesCount: 10,
  postId: 'post-456',
  userId: 'user-123',
};

const VALID_LIKE_ACTION_RESPONSE: LikeActionResponse = {
  success: true,
  message: 'Post liked successfully',
  likesCount: 11,
};

const VALID_UNLIKE_ACTION_RESPONSE: LikeActionResponse = {
  success: true,
  message: 'Post unliked successfully',
  likesCount: 9,
};

describe('Likes Schema Validation', () => {
  describe('validateLikePostRequest', () => {
    it('should validate a valid like request successfully', () => {
      const result = validateLikePostRequest(VALID_LIKE_REQUEST);

      expect(result).toEqual(VALID_LIKE_REQUEST);
      expect(result.userId).toBe('user-123');
      expect(result.postId).toBe('post-456');
    });

    it('should reject like request with missing userId', () => {
      const invalidRequest = {
        postId: 'post-456'
      };

      expect(() => validateLikePostRequest(invalidRequest)).toThrow();
    });

    it('should reject like request with missing postId', () => {
      const invalidRequest = {
        userId: 'user-123'
      };

      expect(() => validateLikePostRequest(invalidRequest)).toThrow();
    });

    it('should reject like request with empty userId', () => {
      const invalidRequest = {
        userId: '',
        postId: 'post-456'
      };

      expect(() => validateLikePostRequest(invalidRequest)).toThrow();
    });

    it('should reject like request with empty postId', () => {
      const invalidRequest = {
        userId: 'user-123',
        postId: ''
      };

      expect(() => validateLikePostRequest(invalidRequest)).toThrow();
    });

    it('should reject like request with non-string userId', () => {
      const invalidRequest = {
        userId: 123,
        postId: 'post-456'
      };

      expect(() => validateLikePostRequest(invalidRequest)).toThrow();
    });

    it('should reject like request with non-string postId', () => {
      const invalidRequest = {
        userId: 'user-123',
        postId: 456
      };

      expect(() => validateLikePostRequest(invalidRequest)).toThrow();
    });
  });

  describe('validateUnlikePostRequest', () => {
    it('should validate a valid unlike request successfully', () => {
      const result = validateUnlikePostRequest(VALID_UNLIKE_REQUEST);

      expect(result).toEqual(VALID_UNLIKE_REQUEST);
      expect(result.userId).toBe('user-123');
      expect(result.postId).toBe('post-456');
    });

    it('should have same validation rules as like request', () => {
      // Unlike request uses same schema as like request
      const validRequest = { userId: 'user-789', postId: 'post-999' };

      const likeResult = validateLikePostRequest(validRequest);
      const unlikeResult = validateUnlikePostRequest(validRequest);

      expect(likeResult).toEqual(unlikeResult);
    });

    it('should reject invalid unlike request same as like request', () => {
      const invalidRequest = { userId: '', postId: 'post-456' };

      expect(() => validateLikePostRequest(invalidRequest)).toThrow();
      expect(() => validateUnlikePostRequest(invalidRequest)).toThrow();
    });
  });

  describe('validateLikeStatusResponse', () => {
    it('should validate a valid like status response successfully', () => {
      const result = validateLikeStatusResponse(VALID_LIKE_STATUS_RESPONSE);

      expect(result).toEqual(VALID_LIKE_STATUS_RESPONSE);
      expect(result.isLiked).toBe(true);
      expect(result.likesCount).toBe(10);
      expect(result.postId).toBe('post-456');
      expect(result.userId).toBe('user-123');
    });

    it('should validate like status response with isLiked false', () => {
      const unlikedResponse = {
        ...VALID_LIKE_STATUS_RESPONSE,
        isLiked: false,
        likesCount: 0
      };

      const result = validateLikeStatusResponse(unlikedResponse);
      expect(result.isLiked).toBe(false);
      expect(result.likesCount).toBe(0);
    });

    it('should reject like status response with missing isLiked', () => {
      const invalidResponse = {
        likesCount: 10,
        postId: 'post-456',
        userId: 'user-123'
      };

      expect(() => validateLikeStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject like status response with missing likesCount', () => {
      const invalidResponse = {
        isLiked: true,
        postId: 'post-456',
        userId: 'user-123'
      };

      expect(() => validateLikeStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject like status response with negative likesCount', () => {
      const invalidResponse = {
        ...VALID_LIKE_STATUS_RESPONSE,
        likesCount: -1
      };

      expect(() => validateLikeStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject like status response with non-boolean isLiked', () => {
      const invalidResponse = {
        ...VALID_LIKE_STATUS_RESPONSE,
        isLiked: 'true'
      };

      expect(() => validateLikeStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject like status response with empty postId', () => {
      const invalidResponse = {
        ...VALID_LIKE_STATUS_RESPONSE,
        postId: ''
      };

      expect(() => validateLikeStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject like status response with empty userId', () => {
      const invalidResponse = {
        ...VALID_LIKE_STATUS_RESPONSE,
        userId: ''
      };

      expect(() => validateLikeStatusResponse(invalidResponse)).toThrow();
    });
  });

  describe('validateLikeActionResponse', () => {
    it('should validate a valid like action response successfully', () => {
      const result = validateLikeActionResponse(VALID_LIKE_ACTION_RESPONSE);

      expect(result).toEqual(VALID_LIKE_ACTION_RESPONSE);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Post liked successfully');
      expect(result.likesCount).toBe(11);
    });

    it('should validate unlike action response successfully', () => {
      const result = validateLikeActionResponse(VALID_UNLIKE_ACTION_RESPONSE);

      expect(result).toEqual(VALID_UNLIKE_ACTION_RESPONSE);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Post unliked successfully');
      expect(result.likesCount).toBe(9);
    });

    it('should validate action response with success false', () => {
      const failureResponse = {
        success: false,
        message: 'Failed to like post',
        likesCount: 10
      };

      const result = validateLikeActionResponse(failureResponse);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to like post');
    });

    it('should reject action response with missing success', () => {
      const invalidResponse = {
        message: 'Post liked successfully',
        likesCount: 11
      };

      expect(() => validateLikeActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with missing message', () => {
      const invalidResponse = {
        success: true,
        likesCount: 11
      };

      expect(() => validateLikeActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with empty message', () => {
      const invalidResponse = {
        ...VALID_LIKE_ACTION_RESPONSE,
        message: ''
      };

      expect(() => validateLikeActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with missing likesCount', () => {
      const invalidResponse = {
        success: true,
        message: 'Post liked successfully'
      };

      expect(() => validateLikeActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with negative likesCount', () => {
      const invalidResponse = {
        ...VALID_LIKE_ACTION_RESPONSE,
        likesCount: -1
      };

      expect(() => validateLikeActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with non-boolean success', () => {
      const invalidResponse = {
        ...VALID_LIKE_ACTION_RESPONSE,
        success: 'true'
      };

      expect(() => validateLikeActionResponse(invalidResponse)).toThrow();
    });
  });

  describe('Schema Consistency', () => {
    it('should have consistent request structure between like and unlike', () => {
      const request = { userId: 'user-999', postId: 'post-888' };

      const likeResult = validateLikePostRequest(request);
      const unlikeResult = validateUnlikePostRequest(request);

      expect(likeResult).toEqual(unlikeResult);
      expect(likeResult.userId).toBe(request.userId);
      expect(likeResult.postId).toBe(request.postId);
    });

    it('should enforce same field requirements across like and unlike requests', () => {
      const requiredFields = ['userId', 'postId'];

      requiredFields.forEach(field => {
        const invalidRequest = { userId: 'user-123', postId: 'post-456' };
        delete invalidRequest[field as keyof typeof invalidRequest];

        // Both schemas should reject requests missing required fields
        expect(() => validateLikePostRequest(invalidRequest)).toThrow();
        expect(() => validateUnlikePostRequest(invalidRequest)).toThrow();
      });
    });

    it('should have consistent field types across all schemas', () => {
      // Verify that userId and postId are consistently typed as strings
      const validIds = { userId: 'user-test', postId: 'post-test' };
      const invalidIds = { userId: 123, postId: 456 };

      // Request schemas should accept valid string IDs
      expect(() => validateLikePostRequest(validIds)).not.toThrow();
      expect(() => validateUnlikePostRequest(validIds)).not.toThrow();

      // Request schemas should reject non-string IDs
      expect(() => validateLikePostRequest(invalidIds)).toThrow();
      expect(() => validateUnlikePostRequest(invalidIds)).toThrow();

      // Response schemas should accept valid string IDs
      const validStatusResponse = {
        ...VALID_LIKE_STATUS_RESPONSE,
        ...validIds
      };
      expect(() => validateLikeStatusResponse(validStatusResponse)).not.toThrow();
    });

    it('should enforce non-negative likesCount across response schemas', () => {
      const negativeLikesStatus = {
        ...VALID_LIKE_STATUS_RESPONSE,
        likesCount: -5
      };

      const negativeLikesAction = {
        ...VALID_LIKE_ACTION_RESPONSE,
        likesCount: -3
      };

      expect(() => validateLikeStatusResponse(negativeLikesStatus)).toThrow();
      expect(() => validateLikeActionResponse(negativeLikesAction)).toThrow();
    });
  });
});