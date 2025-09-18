// Mock implementation of ProfileData for testing
export class ProfileData {
  static async createProfile(profileData: any) {
    return {
      ...profileData,
      userId: profileData.userId || 'user123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static async getProfile(userId: string) {
    return {
      userId,
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      bio: 'Test bio',
      avatar: 'https://example.com/avatar.jpg',
      followersCount: 10,
      followingCount: 5,
      postsCount: 20,
      isVerified: false,
      isPrivate: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };
  }

  static async updateProfile(userId: string, updates: any) {
    const profile = await this.getProfile(userId);
    return {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }

  static async deleteProfile(userId: string) {
    return { success: true, deletedUserId: userId };
  }

  static async getPublicProfile(profile: any) {
    if (!profile) return null;

    // Remove sensitive fields
    const { email, ...publicProfile } = profile;
    return publicProfile;
  }

  static async listProfiles(limit: number = 50, lastKey?: any) {
    return {
      profiles: [
        {
          userId: 'user1',
          username: 'user1',
          displayName: 'User One',
          bio: 'First user',
          avatar: 'https://example.com/avatar1.jpg',
          followersCount: 15,
          followingCount: 8,
          postsCount: 25,
          isVerified: true,
          isPrivate: false
        },
        {
          userId: 'user2',
          username: 'user2',
          displayName: 'User Two',
          bio: 'Second user',
          avatar: 'https://example.com/avatar2.jpg',
          followersCount: 5,
          followingCount: 12,
          postsCount: 10,
          isVerified: false,
          isPrivate: true
        }
      ],
      lastKey: null
    };
  }
}