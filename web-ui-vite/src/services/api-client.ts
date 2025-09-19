/**
 * API client service using functional composition and proper HTTP handling
 *
 * Uses ky HTTP client library instead of hand-rolled fetch.
 * Follows CLAUDE.md principles for functional programming and error handling.
 */

import ky, { type KyInstance } from 'ky';
import { ENV } from '../config/environment';
import {
  type ProfileResponse,
  type CreateProfileRequest,
  type UpdateProfileRequest,
  type CreatePostRequest,
  type PostResponse,
  type GetFeedResponse,
  type CreateFeedItemsRequest,
  validateApiError,
  validateProfileResponse,
  validatePostResponse,
  validateGetFeedResponse
} from '../schemas/shared-schemas';

/**
 * API client configuration
 */
const API_CONFIG = {
  timeout: 30000,
  retry: 2,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * Create configured ky instance for API calls
 */
const createApiClient = (): KyInstance => {
  return ky.create({
    prefixUrl: ENV.apiUrl,
    timeout: API_CONFIG.timeout,
    retry: API_CONFIG.retry,
    headers: API_CONFIG.headers,
    hooks: {
      beforeError: [
        async (error) => {
          const { response } = error;
          if (response && response.body) {
            try {
              const errorData = await response.json();
              const validatedError = validateApiError(errorData);
              error.message = validatedError.error;
            } catch {
              // If we can't parse the error, use the original message
            }
          }
          return error;
        },
      ],
    },
  });
};

/**
 * API client instance
 */
const apiClient = createApiClient();

/**
 * Generic HTTP method helpers using functional composition
 */
const makeRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  options?: { json?: unknown; searchParams?: Record<string, string> }
): Promise<T> => {
  const response = await apiClient[method](endpoint, options);
  return await response.json<T>();
};

/**
 * Profile API endpoints using functional composition
 */
export const profileApi = {
  /**
   * Create a new profile
   * @param profileData - Profile creation data
   * @returns Promise resolving to created profile
   */
  create: async (profileData: CreateProfileRequest): Promise<ProfileResponse> => {
    const response = await makeRequest<ProfileResponse>('post', 'profiles', { json: profileData });
    return validateProfileResponse(response);
  },

  /**
   * Get profile by user ID
   * @param userId - User identifier
   * @returns Promise resolving to profile data
   */
  getById: async (userId: string): Promise<ProfileResponse> => {
    const response = await makeRequest<ProfileResponse>('get', `profiles/${userId}`);
    return validateProfileResponse(response);
  },

  /**
   * Update existing profile
   * @param userId - User identifier
   * @param updates - Profile update data
   * @returns Promise resolving to updated profile
   */
  update: async (userId: string, updates: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await makeRequest<ProfileResponse>('put', `profiles/${userId}`, { json: updates });
    return validateProfileResponse(response);
  },
};

/**
 * Posts API endpoints using shared schemas
 */
export const postsApi = {
  /**
   * Create a new post
   * @param postData - Post creation data
   * @returns Promise resolving to created post
   */
  create: async (postData: CreatePostRequest): Promise<PostResponse> => {
    const response = await makeRequest<PostResponse>('post', 'posts', { json: postData });
    return validatePostResponse(response);
  },

  /**
   * Get posts by user ID
   * @param userId - User identifier
   * @returns Promise resolving to user posts
   */
  getUserPosts: async (userId: string): Promise<PostResponse[]> => {
    const response = await makeRequest<PostResponse[]>('get', `posts/user/${userId}`);
    return response.map(validatePostResponse);
  },
};

/**
 * Feed API endpoints using shared schemas
 */
export const feedApi = {
  /**
   * Get user's feed
   * @param userId - User identifier
   * @returns Promise resolving to user's feed
   */
  getUserFeed: async (userId: string): Promise<GetFeedResponse> => {
    const response = await makeRequest<GetFeedResponse>('get', `feed/${userId}`);
    return validateGetFeedResponse(response);
  },

  /**
   * Create feed items (typically used by system processes)
   * @param feedItemsData - Feed items to create
   * @returns Promise resolving to success
   */
  createFeedItems: async (feedItemsData: CreateFeedItemsRequest): Promise<void> => {
    await makeRequest<void>('post', 'feed/items', { json: feedItemsData });
  },
};

/**
 * Error handling utilities
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Request ID generation for debugging
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};