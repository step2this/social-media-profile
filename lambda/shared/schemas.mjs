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