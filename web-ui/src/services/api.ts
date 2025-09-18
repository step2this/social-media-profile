import { Profile, CreateProfileRequest, UpdateProfileRequest, ApiError, Post, CreatePostRequest, FeedItem } from '@/types/profile';
import { ServiceConfig } from '@/shared/config';

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${ServiceConfig.getApiUrl()}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error);
    }

    return response.json();
  }

  async createProfile(profileData: CreateProfileRequest): Promise<Profile> {
    return this.makeRequest<Profile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getProfile(userId: string): Promise<Profile> {
    return this.makeRequest<Profile>(`/profiles/${userId}`);
  }

  async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<Profile> {
    return this.makeRequest<Profile>(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Social features
  async followUser(followerId: string, followedUserId: string): Promise<{ message: string; followerId: string; followedUserId: string; createdAt: string }> {
    return this.makeRequest('/social/follow', {
      method: 'POST',
      body: JSON.stringify({ followerId, followedUserId }),
    });
  }

  async unfollowUser(followerId: string, followedUserId: string): Promise<{ message: string; followerId: string; followedUserId: string; timestamp: string }> {
    return this.makeRequest('/social/unfollow', {
      method: 'POST',
      body: JSON.stringify({ followerId, followedUserId }),
    });
  }

  async checkFollowStatus(followerId: string, followedUserId: string): Promise<{ isFollowing: boolean; followerId: string; followedUserId: string }> {
    return this.makeRequest(`/social/check-follow/${followerId}/${followedUserId}`);
  }

  // Posts features
  async createPost(userId: string, postData: CreatePostRequest): Promise<Post> {
    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify({ userId, ...postData }),
    });
  }

  async getUserPosts(userId: string): Promise<{ posts: Post[]; userId: string }> {
    return this.makeRequest(`/posts/user/${userId}`);
  }

  async getUserFeed(userId: string): Promise<{ feedItems: FeedItem[]; userId: string }> {
    return this.makeRequest(`/feed/${userId}`);
  }

  // Mock method for listing profiles (not implemented in backend yet)
  async searchProfiles(query?: string): Promise<Profile[]> {
    // This would be implemented as a search endpoint in the backend
    // For now, return mock data
    return [];
  }

  // Discovery content
  async getDiscoveryContent(): Promise<{ users: Profile[]; posts: Post[] }> {
    return this.makeRequest('/discovery');
  }

  // Image Upload methods
  async getImageUploadUrl(fileName: string, fileType: string, userId: string): Promise<{
    uploadUrl: string;
    imageUrl: string;
    key: string;
    fileName: string;
  }> {
    return this.makeRequest('/images/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileType,
        userId,
      }),
    });
  }

  async uploadImageToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }
  }

  async uploadImage(file: File, userId: string): Promise<string> {
    // Get presigned URL
    const { uploadUrl, imageUrl } = await this.getImageUploadUrl(
      file.name,
      file.type,
      userId
    );

    // Upload to S3
    await this.uploadImageToS3(uploadUrl, file);

    // Return the public URL
    return imageUrl;
  }

  // Like functionality
  async likePost(userId: string, postId: string): Promise<{
    success: boolean;
    message: string;
    likesCount: number;
  }> {
    return this.makeRequest('/likes/like', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        postId,
      }),
    });
  }

  async unlikePost(userId: string, postId: string): Promise<{
    success: boolean;
    message: string;
    likesCount: number;
  }> {
    return this.makeRequest('/likes/unlike', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        postId,
      }),
    });
  }

  async checkLikeStatus(userId: string, postId: string): Promise<{
    isLiked: boolean;
    likesCount: number;
    postId: string;
    userId: string;
  }> {
    return this.makeRequest(`/likes/check/${userId}/${postId}`);
  }
}

export const apiService = new ApiService();