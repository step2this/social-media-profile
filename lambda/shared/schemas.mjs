/**
 * Shared validation schemas for profile data
 *
 * Used by both client (web-ui-vite) and server (lambda functions).
 * This ensures consistent validation across the entire stack.
 */

// Note: Using Zod-like validation structure that can be consumed by both ESM and TypeScript
// For now, this is a simple structure that can be expanded to use Zod when lambda supports it

/**
 * Profile request validation schema
 */
export const CreateProfileRequestSchema = {
  type: 'object',
  required: ['username', 'email', 'displayName'],
  properties: {
    username: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'Username is required and must be 1-50 characters'
    },
    email: {
      type: 'string',
      format: 'email',
      message: 'Invalid email format'
    },
    displayName: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      message: 'Display name is required and must be 1-100 characters'
    },
    bio: {
      type: 'string',
      maxLength: 500,
      optional: true,
      message: 'Bio must be 500 characters or less'
    },
    avatar: {
      type: 'string',
      format: 'url',
      optional: true,
      message: 'Avatar must be a valid URL'
    }
  }
};

/**
 * Profile response schema - what server returns
 */
export const ProfileResponseSchema = {
  type: 'object',
  required: [
    'userId', 'username', 'displayName', 'bio', 'avatar',
    'followersCount', 'followingCount', 'postsCount',
    'isVerified', 'isPrivate', 'createdAt'
  ],
  properties: {
    userId: { type: 'string', minLength: 1 },
    username: { type: 'string', minLength: 1, maxLength: 50 },
    displayName: { type: 'string', minLength: 1, maxLength: 100 },
    bio: { type: 'string', maxLength: 500 },
    avatar: { type: 'string' },
    followersCount: { type: 'number', minimum: 0 },
    followingCount: { type: 'number', minimum: 0 },
    postsCount: { type: 'number', minimum: 0 },
    isVerified: { type: 'boolean' },
    isPrivate: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

/**
 * Simple validation function for create profile request
 */
export function validateCreateProfileRequest(data) {
  const errors = [];

  if (!data.username || typeof data.username !== 'string' || data.username.length === 0) {
    errors.push('Username is required');
  }
  if (data.username && data.username.length > 50) {
    errors.push('Username must be 50 characters or less');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  }
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.length === 0) {
    errors.push('Display name is required');
  }
  if (data.displayName && data.displayName.length > 100) {
    errors.push('Display name must be 100 characters or less');
  }

  if (data.bio && data.bio.length > 500) {
    errors.push('Bio must be 500 characters or less');
  }

  if (data.avatar && data.avatar !== '' && !isValidUrl(data.avatar)) {
    errors.push('Avatar must be a valid URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to validate URL format
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Create a clean profile response object
 */
export function createProfileResponse(profile) {
  return {
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio || '',
    avatar: profile.avatar || '',
    followersCount: profile.followersCount || 0,
    followingCount: profile.followingCount || 0,
    postsCount: profile.postsCount || 0,
    isVerified: profile.isVerified || false,
    isPrivate: profile.isPrivate || false,
    createdAt: profile.createdAt,
  };
}

/**
 * Posts domain schemas and validation
 */

/**
 * Create post request validation schema
 */
export const CreatePostRequestSchema = {
  type: 'object',
  required: ['userId', 'content'],
  properties: {
    userId: {
      type: 'string',
      minLength: 1,
      message: 'User ID is required'
    },
    content: {
      type: 'string',
      minLength: 1,
      maxLength: 2000,
      message: 'Content is required and must be 1-2000 characters'
    },
    imageUrl: {
      type: 'string',
      format: 'url',
      optional: true,
      message: 'Image URL must be a valid URL'
    }
  }
};

/**
 * Post response schema - what server returns
 */
export const PostResponseSchema = {
  type: 'object',
  required: [
    'postId', 'userId', 'username', 'displayName', 'content',
    'likesCount', 'commentsCount', 'createdAt'
  ],
  properties: {
    postId: { type: 'string', minLength: 1 },
    userId: { type: 'string', minLength: 1 },
    username: { type: 'string', minLength: 1, maxLength: 50 },
    displayName: { type: 'string', minLength: 1, maxLength: 100 },
    avatar: { type: 'string' },
    content: { type: 'string', minLength: 1, maxLength: 2000 },
    imageUrl: { type: 'string' },
    likesCount: { type: 'number', minimum: 0 },
    commentsCount: { type: 'number', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

/**
 * Simple validation function for create post request
 */
export function validateCreatePostRequest(data) {
  const errors = [];

  if (!data.userId || typeof data.userId !== 'string' || data.userId.length === 0) {
    errors.push('User ID is required');
  }

  if (!data.content || typeof data.content !== 'string' || data.content.length === 0) {
    errors.push('Content is required');
  }
  if (data.content && data.content.length > 2000) {
    errors.push('Content must be 2000 characters or less');
  }

  if (data.imageUrl && data.imageUrl !== '' && !isValidUrl(data.imageUrl)) {
    errors.push('Image URL must be a valid URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a clean post response object
 */
export function createPostResponse(post) {
  return {
    postId: post.postId,
    userId: post.userId,
    username: post.username,
    displayName: post.displayName,
    avatar: post.avatar || '',
    content: post.content,
    imageUrl: post.imageUrl || '',
    likesCount: post.likesCount || 0,
    commentsCount: post.commentsCount || 0,
    createdAt: post.createdAt,
  };
}

/**
 * Feed domain schemas and validation
 */

/**
 * Feed item schema - represents a single item in user's feed
 */
export const FeedItemSchema = {
  type: 'object',
  required: [
    'postId', 'userId', 'username', 'displayName', 'content',
    'likesCount', 'commentsCount', 'createdAt', 'feedTimestamp'
  ],
  properties: {
    postId: { type: 'string', minLength: 1 },
    userId: { type: 'string', minLength: 1 },
    username: { type: 'string', minLength: 1, maxLength: 50 },
    displayName: { type: 'string', minLength: 1, maxLength: 100 },
    avatar: { type: 'string' },
    content: { type: 'string', minLength: 1, maxLength: 2000 },
    imageUrl: { type: 'string' },
    likesCount: { type: 'number', minimum: 0 },
    commentsCount: { type: 'number', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' },
    feedTimestamp: { type: 'number', minimum: 0 }
  }
};

/**
 * Get feed response schema
 */
export const GetFeedResponseSchema = {
  type: 'object',
  required: ['feedItems', 'userId'],
  properties: {
    feedItems: {
      type: 'array',
      items: FeedItemSchema
    },
    userId: { type: 'string', minLength: 1 }
  }
};

/**
 * Create feed items request schema
 */
export const CreateFeedItemsRequestSchema = {
  type: 'object',
  required: ['feedItems'],
  properties: {
    feedItems: {
      type: 'array',
      minItems: 1,
      maxItems: 25, // DynamoDB batch write limit
      items: FeedItemSchema
    }
  }
};

/**
 * Simple validation function for feed item
 */
export function validateFeedItem(data) {
  const errors = [];

  if (!data.postId || typeof data.postId !== 'string' || data.postId.length === 0) {
    errors.push('Post ID is required');
  }

  if (!data.userId || typeof data.userId !== 'string' || data.userId.length === 0) {
    errors.push('User ID is required');
  }

  if (!data.username || typeof data.username !== 'string' || data.username.length === 0) {
    errors.push('Username is required');
  }
  if (data.username && data.username.length > 50) {
    errors.push('Username must be 50 characters or less');
  }

  if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.length === 0) {
    errors.push('Display name is required');
  }
  if (data.displayName && data.displayName.length > 100) {
    errors.push('Display name must be 100 characters or less');
  }

  if (!data.content || typeof data.content !== 'string' || data.content.length === 0) {
    errors.push('Content is required');
  }
  if (data.content && data.content.length > 2000) {
    errors.push('Content must be 2000 characters or less');
  }

  if (typeof data.likesCount !== 'number' || data.likesCount < 0) {
    errors.push('Likes count must be a non-negative number');
  }

  if (typeof data.commentsCount !== 'number' || data.commentsCount < 0) {
    errors.push('Comments count must be a non-negative number');
  }

  if (!data.createdAt || typeof data.createdAt !== 'string') {
    errors.push('Created at timestamp is required');
  }

  if (typeof data.feedTimestamp !== 'number' || data.feedTimestamp < 0) {
    errors.push('Feed timestamp must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Simple validation function for create feed items request
 */
export function validateCreateFeedItemsRequest(data) {
  const errors = [];

  if (!data.feedItems || !Array.isArray(data.feedItems)) {
    errors.push('Feed items must be an array');
    return { isValid: false, errors };
  }

  if (data.feedItems.length === 0) {
    errors.push('At least one feed item is required');
  }

  if (data.feedItems.length > 25) {
    errors.push('Maximum 25 feed items allowed per request');
  }

  // Validate each feed item
  data.feedItems.forEach((item, index) => {
    const itemValidation = validateFeedItem(item);
    if (!itemValidation.isValid) {
      errors.push(`Feed item ${index}: ${itemValidation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a clean feed item response object
 */
export function createFeedItemResponse(feedItem) {
  return {
    postId: feedItem.postId,
    userId: feedItem.userId,
    username: feedItem.username,
    displayName: feedItem.displayName,
    avatar: feedItem.avatar || '',
    content: feedItem.content,
    imageUrl: feedItem.imageUrl || '',
    likesCount: feedItem.likesCount || 0,
    commentsCount: feedItem.commentsCount || 0,
    createdAt: feedItem.createdAt,
    feedTimestamp: feedItem.feedTimestamp,
  };
}

/**
 * Create a clean feed response object
 */
export function createFeedResponse(feedItems, userId) {
  return {
    feedItems: feedItems.map(createFeedItemResponse),
    userId: userId,
  };
}

/**
 * Likes domain schemas and validation
 */

/**
 * Like post request schema
 */
export const LikePostRequestSchema = {
  type: 'object',
  required: ['userId', 'postId'],
  properties: {
    userId: { type: 'string', minLength: 1 },
    postId: { type: 'string', minLength: 1 }
  }
};

/**
 * Unlike post request schema (same as like)
 */
export const UnlikePostRequestSchema = LikePostRequestSchema;

/**
 * Like status response schema
 */
export const LikeStatusResponseSchema = {
  type: 'object',
  required: ['isLiked', 'likesCount', 'postId', 'userId'],
  properties: {
    isLiked: { type: 'boolean' },
    likesCount: { type: 'number', minimum: 0 },
    postId: { type: 'string', minLength: 1 },
    userId: { type: 'string', minLength: 1 }
  }
};

/**
 * Like action response schema (for like/unlike operations)
 */
export const LikeActionResponseSchema = {
  type: 'object',
  required: ['success', 'message', 'likesCount'],
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string', minLength: 1 },
    likesCount: { type: 'number', minimum: 0 }
  }
};

/**
 * Simple validation function for like/unlike requests
 */
export function validateLikeRequest(data) {
  const errors = [];

  if (!data.userId || typeof data.userId !== 'string' || data.userId.length === 0) {
    errors.push('User ID is required');
  }

  if (!data.postId || typeof data.postId !== 'string' || data.postId.length === 0) {
    errors.push('Post ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a clean like status response object
 */
export function createLikeStatusResponse(likeItem, postItem, userId, postId) {
  return {
    isLiked: !!likeItem,
    likesCount: postItem?.likesCount || 0,
    postId: postId,
    userId: userId,
  };
}

/**
 * Create a clean like action response object
 */
export function createLikeActionResponse(isLiked, likesCount) {
  return {
    success: true,
    message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
    likesCount: Math.max(likesCount, 0),
  };
}

/**
 * Social domain schemas and validation
 */

/**
 * Follow request schema
 */
export const FollowRequestSchema = {
  type: 'object',
  required: ['followerId', 'followedUserId'],
  properties: {
    followerId: { type: 'string', minLength: 1 },
    followedUserId: { type: 'string', minLength: 1 }
  }
};

/**
 * Unfollow request schema (same as follow)
 */
export const UnfollowRequestSchema = FollowRequestSchema;

/**
 * Follow status response schema
 */
export const FollowStatusResponseSchema = {
  type: 'object',
  required: ['isFollowing', 'followerId', 'followedUserId'],
  properties: {
    isFollowing: { type: 'boolean' },
    followerId: { type: 'string', minLength: 1 },
    followedUserId: { type: 'string', minLength: 1 }
  }
};

/**
 * Follow action response schema (for follow/unfollow operations)
 */
export const FollowActionResponseSchema = {
  type: 'object',
  required: ['message', 'followerId', 'followedUserId', 'createdAt'],
  properties: {
    message: { type: 'string', minLength: 1 },
    followerId: { type: 'string', minLength: 1 },
    followedUserId: { type: 'string', minLength: 1 },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

/**
 * Simple validation function for follow/unfollow requests
 */
export function validateFollowRequest(data) {
  const errors = [];

  if (!data.followerId || typeof data.followerId !== 'string' || data.followerId.length === 0) {
    errors.push('Follower ID is required');
  }

  if (!data.followedUserId || typeof data.followedUserId !== 'string' || data.followedUserId.length === 0) {
    errors.push('Followed user ID is required');
  }

  if (data.followerId === data.followedUserId) {
    errors.push('Cannot follow yourself');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a clean follow status response object
 */
export function createFollowStatusResponse(followItem, followerId, followedUserId) {
  return {
    isFollowing: !!followItem,
    followerId: followerId,
    followedUserId: followedUserId,
  };
}

/**
 * Create a clean follow action response object
 */
export function createFollowActionResponse(isFollow, followerId, followedUserId, timestamp) {
  return {
    message: isFollow ? 'Successfully followed user' : 'Successfully unfollowed user',
    followerId: followerId,
    followedUserId: followedUserId,
    createdAt: timestamp,
  };
}

/**
 * Images domain schemas and validation
 */

/**
 * Upload URL request schema
 */
export const UploadUrlRequestSchema = {
  type: 'object',
  required: ['fileName', 'fileType', 'userId'],
  properties: {
    fileName: { type: 'string', minLength: 1 },
    fileType: { type: 'string', minLength: 1, pattern: '^image\/' },
    userId: { type: 'string', minLength: 1 }
  }
};

/**
 * Upload URL response schema
 */
export const UploadUrlResponseSchema = {
  type: 'object',
  required: ['uploadUrl', 'imageUrl', 'key', 'fileName'],
  properties: {
    uploadUrl: { type: 'string', minLength: 1 },
    imageUrl: { type: 'string', minLength: 1 },
    key: { type: 'string', minLength: 1 },
    fileName: { type: 'string', minLength: 1 }
  }
};

/**
 * Simple validation function for upload URL requests
 */
export function validateUploadUrlRequest(data) {
  const errors = [];

  if (!data.fileName || typeof data.fileName !== 'string' || data.fileName.length === 0) {
    errors.push('File name is required');
  }

  if (!data.fileType || typeof data.fileType !== 'string' || data.fileType.length === 0) {
    errors.push('File type is required');
  }

  if (data.fileType && !data.fileType.startsWith('image/')) {
    errors.push('Only image files are allowed');
  }

  if (!data.userId || typeof data.userId !== 'string' || data.userId.length === 0) {
    errors.push('User ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a clean upload URL response object
 */
export function createUploadUrlResponse(uploadUrl, imageUrl, key, fileName) {
  return {
    uploadUrl: uploadUrl,
    imageUrl: imageUrl,
    key: key,
    fileName: fileName,
  };
}