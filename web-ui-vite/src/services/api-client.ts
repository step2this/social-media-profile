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
  validateApiError,
  validateProfileResponse
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