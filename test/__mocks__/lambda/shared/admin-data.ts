// Mock implementation of AdminData for testing
export class AdminData {
  static async deleteUser(userId: string) {
    return { success: true, deletedUser: userId };
  }

  static async listUsers(page: number = 1, limit: number = 50) {
    return {
      users: [
        {
          userId: 'user1',
          username: 'testuser1',
          displayName: 'Test User 1',
          email: 'test1@example.com',
          bio: 'Test bio',
          avatar: 'https://example.com/avatar1.jpg',
          followersCount: 10,
          followingCount: 5,
          postsCount: 20,
          isVerified: false,
          isPrivate: false,
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ],
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalUsers: 1,
        pageSize: limit,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }

  static async generateTestData(userCount: number, postsPerUser: number) {
    return {
      success: true,
      usersCreated: userCount,
      postsCreated: userCount * postsPerUser
    };
  }

  static async cleanupAllData() {
    return {
      success: true,
      usersDeleted: 0,
      postsDeleted: 0,
      itemsDeleted: 0
    };
  }
}