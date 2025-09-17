import { Profile } from '@/types/profile';
import { API_ENDPOINTS, buildEndpoint, buildQueryString } from '@/shared/endpoints';
import { ServiceConfig } from '@/shared/config';

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

class AdminService {
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

    return response.json();
  }

  async listUsers(page = 1, limit = 10): Promise<UserListResponse> {
    return this.makeRequest<UserListResponse>(`/admin/users?page=${page}&limit=${limit}`);
  }

  async deleteUser(userId: string): Promise<{ message: string; deletedItems: number; userId: string }> {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async cleanupAll(): Promise<CleanupResponse> {
    return this.makeRequest<CleanupResponse>('/admin/cleanup', {
      method: 'POST',
    });
  }

  async generateTestData(userCount = 5, postsPerUser = 3): Promise<TestDataResponse> {
    return this.makeRequest<TestDataResponse>(`/admin/test-data?userCount=${userCount}&postsPerUser=${postsPerUser}`, {
      method: 'POST',
    });
  }

  async getEvents(limit = 50, nextToken?: string): Promise<EventsResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (nextToken) {
      params.append('nextToken', nextToken);
    }

    return this.makeRequest<EventsResponse>(`/admin/events?${params.toString()}`);
  }
}

export const adminService = new AdminService();