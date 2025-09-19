/**
 * Unit tests for Feed shared schema validation
 *
 * Tests that client and server use identical validation rules.
 * Following CLAUDE.md principles for focused, fixture-based testing.
 */

import { describe, it, expect } from 'vitest';

// Import shared schemas for validation testing
import {
  validateFeedItem,
  validateGetFeedResponse,
  validateCreateFeedItemsRequest,
  type FeedItem,
  type GetFeedResponse,
  type CreateFeedItemsRequest
} from '../../../src/schemas/shared-schemas';

// Test fixtures
const VALID_FEED_ITEM: FeedItem = {
  postId: 'post-123',
  userId: 'user-456',
  username: 'testuser',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  content: 'This is a test post content for the feed',
  imageUrl: 'https://example.com/image.jpg',
  likesCount: 10,
  commentsCount: 3,
  createdAt: '2023-01-01T12:00:00Z',
  feedTimestamp: 1672574400000,
};

const VALID_GET_FEED_RESPONSE: GetFeedResponse = {
  feedItems: [VALID_FEED_ITEM],
  userId: 'user-789',
};

const VALID_CREATE_FEED_ITEMS_REQUEST: CreateFeedItemsRequest = {
  feedItems: [VALID_FEED_ITEM],
};

describe('Feed Schema Validation', () => {
  describe('validateFeedItem', () => {
    it('should validate a valid feed item successfully', () => {
      const result = validateFeedItem(VALID_FEED_ITEM);

      expect(result).toEqual(VALID_FEED_ITEM);
      expect(result.postId).toBe('post-123');
      expect(result.userId).toBe('user-456');
      expect(result.likesCount).toBe(10);
      expect(result.feedTimestamp).toBe(1672574400000);
    });

    it('should reject feed item with missing required fields', () => {
      const invalidItem = {
        postId: 'post-123',
        content: 'Missing other required fields'
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });

    it('should reject feed item with negative likes count', () => {
      const invalidItem = {
        ...VALID_FEED_ITEM,
        likesCount: -1
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });

    it('should reject feed item with negative comments count', () => {
      const invalidItem = {
        ...VALID_FEED_ITEM,
        commentsCount: -5
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });

    it('should reject feed item with negative feed timestamp', () => {
      const invalidItem = {
        ...VALID_FEED_ITEM,
        feedTimestamp: -1
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });

    it('should reject feed item with content too long', () => {
      const invalidItem = {
        ...VALID_FEED_ITEM,
        content: 'x'.repeat(2001) // Over 2000 character limit
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });

    it('should reject feed item with username too long', () => {
      const invalidItem = {
        ...VALID_FEED_ITEM,
        username: 'x'.repeat(51) // Over 50 character limit
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });

    it('should reject feed item with display name too long', () => {
      const invalidItem = {
        ...VALID_FEED_ITEM,
        displayName: 'x'.repeat(101) // Over 100 character limit
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });

    it('should reject feed item with invalid datetime format', () => {
      const invalidItem = {
        ...VALID_FEED_ITEM,
        createdAt: 'not-a-valid-datetime'
      };

      expect(() => validateFeedItem(invalidItem)).toThrow();
    });
  });

  describe('validateGetFeedResponse', () => {
    it('should validate a valid feed response successfully', () => {
      const result = validateGetFeedResponse(VALID_GET_FEED_RESPONSE);

      expect(result).toEqual(VALID_GET_FEED_RESPONSE);
      expect(result.userId).toBe('user-789');
      expect(result.feedItems).toHaveLength(1);
      expect(result.feedItems[0].postId).toBe('post-123');
    });

    it('should validate empty feed response', () => {
      const emptyFeedResponse = {
        feedItems: [],
        userId: 'user-123'
      };

      const result = validateGetFeedResponse(emptyFeedResponse);
      expect(result.feedItems).toHaveLength(0);
      expect(result.userId).toBe('user-123');
    });

    it('should reject feed response with missing userId', () => {
      const invalidResponse = {
        feedItems: [VALID_FEED_ITEM]
      };

      expect(() => validateGetFeedResponse(invalidResponse)).toThrow();
    });

    it('should reject feed response with invalid feed items', () => {
      const invalidResponse = {
        feedItems: [{ postId: 'incomplete-item' }],
        userId: 'user-123'
      };

      expect(() => validateGetFeedResponse(invalidResponse)).toThrow();
    });

    it('should validate feed response with multiple items', () => {
      const multiItemResponse = {
        feedItems: [
          VALID_FEED_ITEM,
          { ...VALID_FEED_ITEM, postId: 'post-456', feedTimestamp: 1672574500000 }
        ],
        userId: 'user-789'
      };

      const result = validateGetFeedResponse(multiItemResponse);
      expect(result.feedItems).toHaveLength(2);
      expect(result.feedItems[1].postId).toBe('post-456');
    });
  });

  describe('validateCreateFeedItemsRequest', () => {
    it('should validate a valid create feed items request successfully', () => {
      const result = validateCreateFeedItemsRequest(VALID_CREATE_FEED_ITEMS_REQUEST);

      expect(result).toEqual(VALID_CREATE_FEED_ITEMS_REQUEST);
      expect(result.feedItems).toHaveLength(1);
      expect(result.feedItems[0].postId).toBe('post-123');
    });

    it('should reject request with empty feed items array', () => {
      const invalidRequest = {
        feedItems: []
      };

      expect(() => validateCreateFeedItemsRequest(invalidRequest)).toThrow();
    });

    it('should reject request with too many feed items', () => {
      const tooManyItems = Array(26).fill(VALID_FEED_ITEM); // Over 25 item limit
      const invalidRequest = {
        feedItems: tooManyItems
      };

      expect(() => validateCreateFeedItemsRequest(invalidRequest)).toThrow();
    });

    it('should reject request with invalid feed items', () => {
      const invalidRequest = {
        feedItems: [{ postId: 'incomplete-item' }]
      };

      expect(() => validateCreateFeedItemsRequest(invalidRequest)).toThrow();
    });

    it('should validate request with maximum allowed items', () => {
      const maxItems = Array(25).fill(VALID_FEED_ITEM); // Exactly 25 items (limit)
      const validRequest = {
        feedItems: maxItems
      };

      const result = validateCreateFeedItemsRequest(validRequest);
      expect(result.feedItems).toHaveLength(25);
    });

    it('should validate request with multiple different feed items', () => {
      const multipleItemsRequest = {
        feedItems: [
          VALID_FEED_ITEM,
          { ...VALID_FEED_ITEM, postId: 'post-456', userId: 'user-999' },
          { ...VALID_FEED_ITEM, postId: 'post-789', content: 'Different content' }
        ]
      };

      const result = validateCreateFeedItemsRequest(multipleItemsRequest);
      expect(result.feedItems).toHaveLength(3);
      expect(result.feedItems[1].postId).toBe('post-456');
      expect(result.feedItems[2].content).toBe('Different content');
    });
  });

  describe('Schema Consistency', () => {
    it('should have consistent feed item structure across all schemas', () => {
      // Verify that feed item in response matches feed item in create request
      const feedItem = VALID_FEED_ITEM;
      const responseItem = VALID_GET_FEED_RESPONSE.feedItems[0];
      const createRequestItem = VALID_CREATE_FEED_ITEMS_REQUEST.feedItems[0];

      expect(responseItem).toEqual(feedItem);
      expect(createRequestItem).toEqual(feedItem);
    });

    it('should enforce same field requirements across schemas', () => {
      const requiredFields = [
        'postId', 'userId', 'username', 'displayName', 'content',
        'likesCount', 'commentsCount', 'createdAt', 'feedTimestamp'
      ];

      requiredFields.forEach(field => {
        const invalidItem = { ...VALID_FEED_ITEM };
        delete invalidItem[field as keyof FeedItem];

        // All schemas should reject items missing required fields
        expect(() => validateFeedItem(invalidItem)).toThrow();
        expect(() => validateGetFeedResponse({
          feedItems: [invalidItem],
          userId: 'user-123'
        })).toThrow();
        expect(() => validateCreateFeedItemsRequest({
          feedItems: [invalidItem]
        })).toThrow();
      });
    });

    it('should enforce same field length limits across schemas', () => {
      const longContent = 'x'.repeat(2001);
      const longUsername = 'x'.repeat(51);
      const longDisplayName = 'x'.repeat(101);

      [longContent, longUsername, longDisplayName].forEach((longValue, index) => {
        const field = ['content', 'username', 'displayName'][index];
        const invalidItem = { ...VALID_FEED_ITEM, [field]: longValue };

        // All schemas should reject items with fields that are too long
        expect(() => validateFeedItem(invalidItem)).toThrow();
        expect(() => validateGetFeedResponse({
          feedItems: [invalidItem],
          userId: 'user-123'
        })).toThrow();
        expect(() => validateCreateFeedItemsRequest({
          feedItems: [invalidItem]
        })).toThrow();
      });
    });
  });
});