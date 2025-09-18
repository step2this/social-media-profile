import { Profile } from '@/types/profile';
import { ServiceConfig } from '@/shared/config';
// Using native array methods instead of lodash for simplicity

const API_BASE_URL = ServiceConfig.getApiUrl();

export interface AdminUser extends Profile {
  // Add any admin-specific fields if needed
}

export interface UserListResponse {
  users: AdminUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TestDataResponse {
  message: string;
  summary: {
    usersCreated: number;
    postsCreated: number;
    totalItems: number;
  };
  users: Array<{
    userId: string;
    username: string;
    displayName: string;
    postsCount: number;
  }>;
  timestamp: string;
}

export interface CleanupResponse {
  message: string;
  deletedDynamoItems: number;
  deletedS3Objects: number;
  timestamp: string;
}

export interface EventBridgeEvent {
  eventId: string;
  source: string;
  detailType: string;
  detail: any;
  timestamp: string;
  region: string;
  account: string;
}

export interface EventsResponse {
  events: EventBridgeEvent[];
  totalEvents: number;
  nextToken?: string;
}

// Constants for default values
const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 0,
  totalUsers: 0,
  pageSize: 10,
  hasNextPage: false,
  hasPreviousPage: false,
} as const;

const DEFAULT_SUMMARY = {
  usersCreated: 0,
  postsCreated: 0,
  totalItems: 0,
} as const;

// Fallback response factory functions
const createUserListFallback = (): UserListResponse => ({
  users: [],
  pagination: DEFAULT_PAGINATION,
});

const createTestDataFallback = (): TestDataResponse => ({
  message: 'Test data generation completed successfully',
  summary: DEFAULT_SUMMARY,
  users: [],
  timestamp: new Date().toISOString(),
});

const createCleanupFallback = (): CleanupResponse => ({
  message: 'Cleanup completed successfully',
  deletedDynamoItems: 0,
  deletedS3Objects: 0,
  timestamp: new Date().toISOString(),
});

const createEventsFallback = (): EventsResponse => ({
  events: [],
  totalEvents: 0,
  nextToken: undefined,
});

const createGenericFallback = () => ({
  message: 'Request completed successfully',
});

// API endpoint constants
const ADMIN_ENDPOINTS = {
  USERS: '/admin/users',
  CLEANUP: '/admin/cleanup',
  TEST_DATA: '/admin/test-data',
  EVENTS: '/admin/events',
} as const;

// Default parameter values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_USER_COUNT = 5;
const DEFAULT_POSTS_PER_USER = 3;
const DEFAULT_EVENTS_LIMIT = 50;

class AdminService {
  private static readonly FALLBACK_PATTERNS = [
    { pathPrefix: '/admin/users', factory: createUserListFallback },
    { pathPrefix: '/admin/test-data', factory: createTestDataFallback },
    { pathPrefix: '/admin/cleanup', factory: createCleanupFallback },
    { pathPrefix: '/admin/events', factory: createEventsFallback },
  ] as const;

  private createFallbackResponse<T>(endpoint: string): T {
    // Extract base path without query parameters for matching
    const basePath = endpoint.split('?')[0];
    const matchedPattern = AdminService.FALLBACK_PATTERNS.find(({ pathPrefix }) =>
      basePath === pathPrefix
    );
    return (matchedPattern?.factory() ?? createGenericFallback()) as T;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || 'Request failed');
    }

    // Handle empty response bodies
    const contentLength = response.headers?.get('content-length');
    if (contentLength === '0') {
      // Return appropriate fallback response based on endpoint
      return this.createFallbackResponse<T>(endpoint);
    }

    try {
      return await response.json();
    } catch (error) {
      // If JSON parsing fails, return appropriate fallback response
      return this.createFallbackResponse<T>(endpoint);
    }
  }

  async listUsers(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT): Promise<UserListResponse> {
    return this.makeRequest<UserListResponse>(`${ADMIN_ENDPOINTS.USERS}?page=${page}&limit=${limit}`);
  }

  async deleteUser(userId: string): Promise<{ message: string; deletedItems: number; userId: string }> {
    return this.makeRequest(`${ADMIN_ENDPOINTS.USERS}/${userId}`, {
      method: 'DELETE',
    });
  }

  async cleanupAll(): Promise<CleanupResponse> {
    return this.makeRequest<CleanupResponse>(ADMIN_ENDPOINTS.CLEANUP, {
      method: 'POST',
    });
  }

  async generateTestData(userCount = DEFAULT_USER_COUNT, postsPerUser = DEFAULT_POSTS_PER_USER): Promise<TestDataResponse> {
    return this.makeRequest<TestDataResponse>(`${ADMIN_ENDPOINTS.TEST_DATA}?userCount=${userCount}&postsPerUser=${postsPerUser}`, {
      method: 'POST',
    });
  }

  async getEvents(limit = DEFAULT_EVENTS_LIMIT, nextToken?: string): Promise<EventsResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (nextToken) {
      params.append('nextToken', nextToken);
    }

    return this.makeRequest<EventsResponse>(`${ADMIN_ENDPOINTS.EVENTS}?${params.toString()}`);
  }
}

export const adminService = new AdminService();