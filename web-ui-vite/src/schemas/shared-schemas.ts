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
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Validation helper functions
export const validateCreateRequest = (data: unknown): CreateProfileRequest => CreateProfileRequestSchema.parse(data);
export const validateProfileResponse = (data: unknown): ProfileResponse => ProfileResponseSchema.parse(data);
export const validateUpdateRequest = (data: unknown): UpdateProfileRequest => UpdateProfileRequestSchema.parse(data);
export const validateApiError = (data: unknown): ApiError => ApiErrorSchema.parse(data);