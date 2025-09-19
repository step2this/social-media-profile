/**
 * Test fixtures for profile data
 *
 * Provides reusable test data following CLAUDE.md principles.
 * Uses constants and structured data for consistent testing.
 */

import { type Profile, type CreateProfileRequest, type UpdateProfileRequest } from '../../src/schemas/profile';

/**
 * Valid profile test fixture
 */
export const VALID_PROFILE: Profile = {
  userId: 'test-user-123',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  bio: 'A test user for testing purposes',
  avatar: 'https://example.com/avatar.jpg',
  followersCount: 42,
  followingCount: 17,
  postsCount: 8,
  isVerified: false,
  isPrivate: false,
  createdAt: '2023-01-15T10:30:00Z',
  updatedAt: '2023-02-01T14:15:00Z',
} as const;

/**
 * Valid create profile request fixture
 */
export const VALID_CREATE_REQUEST: CreateProfileRequest = {
  username: 'newuser',
  email: 'newuser@example.com',
  displayName: 'New User',
  bio: 'A brand new user',
  avatar: 'https://example.com/new-avatar.jpg',
} as const;

/**
 * Valid update profile request fixture
 */
export const VALID_UPDATE_REQUEST: UpdateProfileRequest = {
  displayName: 'Updated User',
  bio: 'An updated bio',
  isPrivate: true,
} as const;

/**
 * Invalid profile data for testing validation
 */
export const INVALID_PROFILE_DATA = {
  missingUsername: {
    email: 'test@example.com',
    displayName: 'Test User',
  },
  invalidEmail: {
    username: 'testuser',
    email: 'invalid-email',
    displayName: 'Test User',
  },
  tooLongBio: {
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    bio: 'x'.repeat(501), // Exceeds 500 character limit
  },
} as const;

/**
 * API error response fixtures
 */
export const API_ERROR_FIXTURES = {
  notFound: {
    error: 'Not Found',
    details: 'Profile not found',
  },
  validationError: {
    error: 'Validation Error',
    details: 'Invalid input data',
  },
  serverError: {
    error: 'Internal Server Error',
    details: 'Database connection failed',
  },
} as const;