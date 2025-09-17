// Centralized endpoint configuration
export const API_ENDPOINTS = {
  // Profile endpoints
  PROFILES: '/profiles',
  PROFILE_BY_ID: '/profiles/{userId}',

  // Social endpoints
  SOCIAL_FOLLOW: '/social/follow',
  SOCIAL_UNFOLLOW: '/social/unfollow',
  SOCIAL_CHECK_FOLLOW: '/social/check-follow/{followerId}/{followedUserId}',

  // Posts endpoints
  POSTS: '/posts',
  POSTS_BY_USER: '/posts/user/{userId}',

  // Feed endpoints
  FEED_BY_USER: '/feed/{userId}',

  // Images endpoints
  IMAGES_UPLOAD_URL: '/images/upload-url',

  // Likes endpoints
  LIKES_LIKE: '/likes/like',
  LIKES_UNLIKE: '/likes/unlike',
  LIKES_CHECK: '/likes/check/{userId}/{postId}',

  // Admin endpoints
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_BY_ID: '/admin/users/{userId}',
  ADMIN_CLEANUP: '/admin/cleanup',
  ADMIN_TEST_DATA: '/admin/test-data',
  ADMIN_EVENTS: '/admin/events'
} as const;

// Helper function to replace path parameters
export function buildEndpoint(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`{${key}}`, value),
    template
  );
}

// Helper function to build query string
export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}