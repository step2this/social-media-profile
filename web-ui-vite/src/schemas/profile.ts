/**
 * Profile data validation schemas using Zod
 *
 * Provides runtime validation for all profile-related data structures.
 * Following CLAUDE.md principles for type safety and validation.
 */

import { z } from 'zod';

/**
 * Profile entity schema - represents a complete user profile
 */
export const ProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  email: z.string().email('Invalid email format'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  followersCount: z.number().int().min(0),
  followingCount: z.number().int().min(0),
  postsCount: z.number().int().min(0),
  isVerified: z.boolean(),
  isPrivate: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Create profile request schema - for new profile creation
 */
export const CreateProfileRequestSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  email: z.string().email('Invalid email format'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

/**
 * Update profile request schema - for profile updates
 */
export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  isPrivate: z.boolean().optional(),
});

/**
 * API error response schema
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

// Export TypeScript types derived from schemas
export type Profile = z.infer<typeof ProfileSchema>;
export type CreateProfileRequest = z.infer<typeof CreateProfileRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Validation helper functions
export const validateProfile = (data: unknown): Profile => ProfileSchema.parse(data);
export const validateCreateRequest = (data: unknown): CreateProfileRequest => CreateProfileRequestSchema.parse(data);
export const validateUpdateRequest = (data: unknown): UpdateProfileRequest => UpdateProfileRequestSchema.parse(data);
export const validateApiError = (data: unknown): ApiError => ApiErrorSchema.parse(data);