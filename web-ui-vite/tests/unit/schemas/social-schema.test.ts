/**
 * Unit tests for Social shared schema validation
 *
 * Tests that client and server use identical validation rules.
 * Following CLAUDE.md principles for focused, fixture-based testing.
 */

import { describe, it, expect } from 'vitest';

// Import shared schemas for validation testing
import {
  validateFollowRequest,
  validateUnfollowRequest,
  validateFollowStatusResponse,
  validateFollowActionResponse,
  type FollowRequest,
  type UnfollowRequest,
  type FollowStatusResponse,
  type FollowActionResponse
} from '../../../src/schemas/shared-schemas';

// Test fixtures
const VALID_FOLLOW_REQUEST: FollowRequest = {
  followerId: 'user-123',
  followedUserId: 'user-456',
};

const VALID_UNFOLLOW_REQUEST: UnfollowRequest = {
  followerId: 'user-123',
  followedUserId: 'user-456',
};

const VALID_FOLLOW_STATUS_RESPONSE: FollowStatusResponse = {
  isFollowing: true,
  followerId: 'user-123',
  followedUserId: 'user-456',
};

const VALID_FOLLOW_ACTION_RESPONSE: FollowActionResponse = {
  message: 'Successfully followed user',
  followerId: 'user-123',
  followedUserId: 'user-456',
  createdAt: '2023-01-01T12:00:00Z',
};

const VALID_UNFOLLOW_ACTION_RESPONSE: FollowActionResponse = {
  message: 'Successfully unfollowed user',
  followerId: 'user-123',
  followedUserId: 'user-456',
  createdAt: '2023-01-01T12:00:00Z',
};

describe('Social Schema Validation', () => {
  describe('validateFollowRequest', () => {
    it('should validate a valid follow request successfully', () => {
      const result = validateFollowRequest(VALID_FOLLOW_REQUEST);

      expect(result).toEqual(VALID_FOLLOW_REQUEST);
      expect(result.followerId).toBe('user-123');
      expect(result.followedUserId).toBe('user-456');
    });

    it('should reject follow request with missing followerId', () => {
      const invalidRequest = {
        followedUserId: 'user-456'
      };

      expect(() => validateFollowRequest(invalidRequest)).toThrow();
    });

    it('should reject follow request with missing followedUserId', () => {
      const invalidRequest = {
        followerId: 'user-123'
      };

      expect(() => validateFollowRequest(invalidRequest)).toThrow();
    });

    it('should reject follow request with empty followerId', () => {
      const invalidRequest = {
        followerId: '',
        followedUserId: 'user-456'
      };

      expect(() => validateFollowRequest(invalidRequest)).toThrow();
    });

    it('should reject follow request with empty followedUserId', () => {
      const invalidRequest = {
        followerId: 'user-123',
        followedUserId: ''
      };

      expect(() => validateFollowRequest(invalidRequest)).toThrow();
    });

    it('should reject follow request when trying to follow yourself', () => {
      const invalidRequest = {
        followerId: 'user-123',
        followedUserId: 'user-123'
      };

      expect(() => validateFollowRequest(invalidRequest)).toThrow('Cannot follow yourself');
    });

    it('should reject follow request with non-string followerId', () => {
      const invalidRequest = {
        followerId: 123,
        followedUserId: 'user-456'
      };

      expect(() => validateFollowRequest(invalidRequest)).toThrow();
    });

    it('should reject follow request with non-string followedUserId', () => {
      const invalidRequest = {
        followerId: 'user-123',
        followedUserId: 456
      };

      expect(() => validateFollowRequest(invalidRequest)).toThrow();
    });
  });

  describe('validateUnfollowRequest', () => {
    it('should validate a valid unfollow request successfully', () => {
      const result = validateUnfollowRequest(VALID_UNFOLLOW_REQUEST);

      expect(result).toEqual(VALID_UNFOLLOW_REQUEST);
      expect(result.followerId).toBe('user-123');
      expect(result.followedUserId).toBe('user-456');
    });

    it('should have same validation rules as follow request', () => {
      // Unfollow request uses same schema as follow request
      const validRequest = { followerId: 'user-789', followedUserId: 'user-999' };

      const followResult = validateFollowRequest(validRequest);
      const unfollowResult = validateUnfollowRequest(validRequest);

      expect(followResult).toEqual(unfollowResult);
    });

    it('should reject invalid unfollow request same as follow request', () => {
      const invalidRequest = { followerId: '', followedUserId: 'user-456' };

      expect(() => validateFollowRequest(invalidRequest)).toThrow();
      expect(() => validateUnfollowRequest(invalidRequest)).toThrow();
    });

    it('should reject unfollow request when trying to unfollow yourself', () => {
      const invalidRequest = {
        followerId: 'user-123',
        followedUserId: 'user-123'
      };

      expect(() => validateUnfollowRequest(invalidRequest)).toThrow('Cannot follow yourself');
    });
  });

  describe('validateFollowStatusResponse', () => {
    it('should validate a valid follow status response successfully', () => {
      const result = validateFollowStatusResponse(VALID_FOLLOW_STATUS_RESPONSE);

      expect(result).toEqual(VALID_FOLLOW_STATUS_RESPONSE);
      expect(result.isFollowing).toBe(true);
      expect(result.followerId).toBe('user-123');
      expect(result.followedUserId).toBe('user-456');
    });

    it('should validate follow status response with isFollowing false', () => {
      const notFollowingResponse = {
        ...VALID_FOLLOW_STATUS_RESPONSE,
        isFollowing: false
      };

      const result = validateFollowStatusResponse(notFollowingResponse);
      expect(result.isFollowing).toBe(false);
      expect(result.followerId).toBe('user-123');
      expect(result.followedUserId).toBe('user-456');
    });

    it('should reject follow status response with missing isFollowing', () => {
      const invalidResponse = {
        followerId: 'user-123',
        followedUserId: 'user-456'
      };

      expect(() => validateFollowStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject follow status response with missing followerId', () => {
      const invalidResponse = {
        isFollowing: true,
        followedUserId: 'user-456'
      };

      expect(() => validateFollowStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject follow status response with missing followedUserId', () => {
      const invalidResponse = {
        isFollowing: true,
        followerId: 'user-123'
      };

      expect(() => validateFollowStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject follow status response with non-boolean isFollowing', () => {
      const invalidResponse = {
        ...VALID_FOLLOW_STATUS_RESPONSE,
        isFollowing: 'true'
      };

      expect(() => validateFollowStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject follow status response with empty followerId', () => {
      const invalidResponse = {
        ...VALID_FOLLOW_STATUS_RESPONSE,
        followerId: ''
      };

      expect(() => validateFollowStatusResponse(invalidResponse)).toThrow();
    });

    it('should reject follow status response with empty followedUserId', () => {
      const invalidResponse = {
        ...VALID_FOLLOW_STATUS_RESPONSE,
        followedUserId: ''
      };

      expect(() => validateFollowStatusResponse(invalidResponse)).toThrow();
    });
  });

  describe('validateFollowActionResponse', () => {
    it('should validate a valid follow action response successfully', () => {
      const result = validateFollowActionResponse(VALID_FOLLOW_ACTION_RESPONSE);

      expect(result).toEqual(VALID_FOLLOW_ACTION_RESPONSE);
      expect(result.message).toBe('Successfully followed user');
      expect(result.followerId).toBe('user-123');
      expect(result.followedUserId).toBe('user-456');
      expect(result.createdAt).toBe('2023-01-01T12:00:00Z');
    });

    it('should validate unfollow action response successfully', () => {
      const result = validateFollowActionResponse(VALID_UNFOLLOW_ACTION_RESPONSE);

      expect(result).toEqual(VALID_UNFOLLOW_ACTION_RESPONSE);
      expect(result.message).toBe('Successfully unfollowed user');
      expect(result.followerId).toBe('user-123');
      expect(result.followedUserId).toBe('user-456');
    });

    it('should reject action response with missing message', () => {
      const invalidResponse = {
        followerId: 'user-123',
        followedUserId: 'user-456',
        createdAt: '2023-01-01T12:00:00Z'
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with empty message', () => {
      const invalidResponse = {
        ...VALID_FOLLOW_ACTION_RESPONSE,
        message: ''
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with missing followerId', () => {
      const invalidResponse = {
        message: 'Successfully followed user',
        followedUserId: 'user-456',
        createdAt: '2023-01-01T12:00:00Z'
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with missing followedUserId', () => {
      const invalidResponse = {
        message: 'Successfully followed user',
        followerId: 'user-123',
        createdAt: '2023-01-01T12:00:00Z'
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with missing createdAt', () => {
      const invalidResponse = {
        message: 'Successfully followed user',
        followerId: 'user-123',
        followedUserId: 'user-456'
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with invalid datetime format', () => {
      const invalidResponse = {
        ...VALID_FOLLOW_ACTION_RESPONSE,
        createdAt: 'not-a-valid-datetime'
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with empty followerId', () => {
      const invalidResponse = {
        ...VALID_FOLLOW_ACTION_RESPONSE,
        followerId: ''
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });

    it('should reject action response with empty followedUserId', () => {
      const invalidResponse = {
        ...VALID_FOLLOW_ACTION_RESPONSE,
        followedUserId: ''
      };

      expect(() => validateFollowActionResponse(invalidResponse)).toThrow();
    });
  });

  describe('Schema Consistency', () => {
    it('should have consistent request structure between follow and unfollow', () => {
      const request = { followerId: 'user-999', followedUserId: 'user-888' };

      const followResult = validateFollowRequest(request);
      const unfollowResult = validateUnfollowRequest(request);

      expect(followResult).toEqual(unfollowResult);
      expect(followResult.followerId).toBe(request.followerId);
      expect(followResult.followedUserId).toBe(request.followedUserId);
    });

    it('should enforce same field requirements across follow and unfollow requests', () => {
      const requiredFields = ['followerId', 'followedUserId'];

      requiredFields.forEach(field => {
        const invalidRequest = { followerId: 'user-123', followedUserId: 'user-456' };
        delete invalidRequest[field as keyof typeof invalidRequest];

        // Both schemas should reject requests missing required fields
        expect(() => validateFollowRequest(invalidRequest)).toThrow();
        expect(() => validateUnfollowRequest(invalidRequest)).toThrow();
      });
    });

    it('should have consistent field types across all schemas', () => {
      // Verify that followerId and followedUserId are consistently typed as strings
      const validIds = { followerId: 'user-test', followedUserId: 'user-test2' };
      const invalidIds = { followerId: 123, followedUserId: 456 };

      // Request schemas should accept valid string IDs
      expect(() => validateFollowRequest(validIds)).not.toThrow();
      expect(() => validateUnfollowRequest(validIds)).not.toThrow();

      // Request schemas should reject non-string IDs
      expect(() => validateFollowRequest(invalidIds)).toThrow();
      expect(() => validateUnfollowRequest(invalidIds)).toThrow();

      // Response schemas should accept valid string IDs
      const validStatusResponse = {
        ...VALID_FOLLOW_STATUS_RESPONSE,
        ...validIds
      };
      expect(() => validateFollowStatusResponse(validStatusResponse)).not.toThrow();

      const validActionResponse = {
        ...VALID_FOLLOW_ACTION_RESPONSE,
        ...validIds
      };
      expect(() => validateFollowActionResponse(validActionResponse)).not.toThrow();
    });

    it('should enforce self-follow validation consistently', () => {
      const selfFollowRequest = {
        followerId: 'user-123',
        followedUserId: 'user-123'
      };

      // Both follow and unfollow should reject self-follow attempts
      expect(() => validateFollowRequest(selfFollowRequest)).toThrow('Cannot follow yourself');
      expect(() => validateUnfollowRequest(selfFollowRequest)).toThrow('Cannot follow yourself');
    });

    it('should handle boolean isFollowing field correctly', () => {
      const trueResponse = { ...VALID_FOLLOW_STATUS_RESPONSE, isFollowing: true };
      const falseResponse = { ...VALID_FOLLOW_STATUS_RESPONSE, isFollowing: false };

      expect(() => validateFollowStatusResponse(trueResponse)).not.toThrow();
      expect(() => validateFollowStatusResponse(falseResponse)).not.toThrow();

      const invalidResponse = { ...VALID_FOLLOW_STATUS_RESPONSE, isFollowing: 'true' };
      expect(() => validateFollowStatusResponse(invalidResponse)).toThrow();
    });
  });
});