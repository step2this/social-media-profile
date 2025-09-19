/**
 * TypeScript wrapper for shared schemas
 *
 * Imports the shared schema definitions and provides Zod compatibility
 * while maintaining consistency with server-side validation.
 */

import { z } from 'zod';

/**
 * Create profile request schema - matches server validation exactly
 */
export const CreateProfileRequestSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username must be 50 characters or less'),
  email: z.string().email('Invalid email format'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name must be 100 characters or less'),
  bio: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().max(500, 'Bio must be 500 characters or less').optional()
  ),
  avatar: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().url({ message: 'Avatar must be a valid URL' }).optional()
  ),
});

/**
 * Profile response schema - matches server response exactly
 */
export const ProfileResponseSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  bio: z.string().max(500, 'Bio too long'),
  avatar: z.string(),
  followersCount: z.number().int().min(0),
  followingCount: z.number().int().min(0),
  postsCount: z.number().int().min(0),
  isVerified: z.boolean(),
  isPrivate: z.boolean(),
  createdAt: z.string().datetime(),
});

/**
 * Update profile request schema
 */
export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatar: z.string().url({ message: 'Invalid avatar URL' }).optional(),
  isPrivate: z.boolean().optional(),
});

/**
 * Posts domain schemas - matches server validation exactly
 */

/**
 * Create post request schema
 */
export const CreatePostRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content must be 2000 characters or less'),
  imageUrl: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().url({ message: 'Image URL must be a valid URL' }).optional()
  ),
});

/**
 * Post response schema - matches server response exactly
 */
export const PostResponseSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  avatar: z.string(),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  imageUrl: z.string(),
  likesCount: z.number().int().min(0),
  commentsCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
});

/**
 * Feed domain schemas - matches server validation exactly
 */

/**
 * Feed item schema - represents a single item in user's feed
 */
export const FeedItemSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  avatar: z.string(),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  imageUrl: z.string(),
  likesCount: z.number().int().min(0),
  commentsCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  feedTimestamp: z.number().int().min(0),
});

/**
 * Get feed response schema
 */
export const GetFeedResponseSchema = z.object({
  feedItems: z.array(FeedItemSchema),
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Create feed items request schema
 */
export const CreateFeedItemsRequestSchema = z.object({
  feedItems: z.array(FeedItemSchema).min(1, 'At least one feed item is required').max(25, 'Maximum 25 feed items allowed'),
});

/**
 * Likes domain schemas - matches server validation exactly
 */

/**
 * Like post request schema
 */
export const LikePostRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  postId: z.string().min(1, 'Post ID is required'),
});

/**
 * Unlike post request schema (same as like)
 */
export const UnlikePostRequestSchema = LikePostRequestSchema;

/**
 * Like status response schema
 */
export const LikeStatusResponseSchema = z.object({
  isLiked: z.boolean(),
  likesCount: z.number().int().min(0),
  postId: z.string().min(1, 'Post ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Like action response schema (for like/unlike operations)
 */
export const LikeActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1, 'Message is required'),
  likesCount: z.number().int().min(0),
});

/**
 * API error response schema
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.union([z.string(), z.array(z.string())]).optional(),
});

// Export TypeScript types
export type CreateProfileRequest = z.infer<typeof CreateProfileRequestSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;
export type PostResponse = z.infer<typeof PostResponseSchema>;
export type FeedItem = z.infer<typeof FeedItemSchema>;
export type GetFeedResponse = z.infer<typeof GetFeedResponseSchema>;
export type CreateFeedItemsRequest = z.infer<typeof CreateFeedItemsRequestSchema>;
export type LikePostRequest = z.infer<typeof LikePostRequestSchema>;
export type UnlikePostRequest = z.infer<typeof UnlikePostRequestSchema>;
export type LikeStatusResponse = z.infer<typeof LikeStatusResponseSchema>;
export type LikeActionResponse = z.infer<typeof LikeActionResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Validation helper functions
export const validateCreateRequest = (data: unknown): CreateProfileRequest => CreateProfileRequestSchema.parse(data);
export const validateProfileResponse = (data: unknown): ProfileResponse => ProfileResponseSchema.parse(data);
export const validateUpdateRequest = (data: unknown): UpdateProfileRequest => UpdateProfileRequestSchema.parse(data);
export const validateCreatePostRequest = (data: unknown): CreatePostRequest => CreatePostRequestSchema.parse(data);
export const validatePostResponse = (data: unknown): PostResponse => PostResponseSchema.parse(data);
export const validateFeedItem = (data: unknown): FeedItem => FeedItemSchema.parse(data);
export const validateGetFeedResponse = (data: unknown): GetFeedResponse => GetFeedResponseSchema.parse(data);
export const validateCreateFeedItemsRequest = (data: unknown): CreateFeedItemsRequest => CreateFeedItemsRequestSchema.parse(data);
export const validateLikePostRequest = (data: unknown): LikePostRequest => LikePostRequestSchema.parse(data);
export const validateUnlikePostRequest = (data: unknown): UnlikePostRequest => UnlikePostRequestSchema.parse(data);
export const validateLikeStatusResponse = (data: unknown): LikeStatusResponse => LikeStatusResponseSchema.parse(data);
export const validateLikeActionResponse = (data: unknown): LikeActionResponse => LikeActionResponseSchema.parse(data);
export const validateApiError = (data: unknown): ApiError => ApiErrorSchema.parse(data);