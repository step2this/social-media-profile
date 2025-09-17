import { Profile } from '@/types/profile';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod';

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
}

export const adminService = new AdminService();