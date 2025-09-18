import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export class TestEnvironment {
  private tableName: string;
  private dynamoClient: DynamoDBDocumentClient;

  constructor(tableName = 'test-profiles') {
    this.tableName = tableName;

    // Use local DynamoDB if available, otherwise mock
    const client = new DynamoDBClient({
      endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });

    this.dynamoClient = DynamoDBDocumentClient.from(client);
  }

  getTableName(): string {
    return this.tableName;
  }

  getDynamoClient(): DynamoDBDocumentClient {
    return this.dynamoClient;
  }

  async checkDynamoDBConnection(): Promise<boolean> {
    try {
      // Try to describe the table to check connection
      await this.dynamoClient.send({
        TableName: this.tableName
      } as any);
      return true;
    } catch (error: any) {
      console.warn('DynamoDB connection failed, tests will use mocks:', error.message);
      return false;
    }
  }

  async setupTestTable(): Promise<void> {
    if (!await this.checkDynamoDBConnection()) {
      console.log('Using mocked DynamoDB for tests');
      return;
    }

    try {
      // Create test table if using local DynamoDB
      const { CreateTableCommand } = await import('@aws-sdk/client-dynamodb');
      const createTableParams = {
        TableName: this.tableName,
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' as const },
          { AttributeName: 'SK', KeyType: 'RANGE' as const }
        ],
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' as const },
          { AttributeName: 'SK', AttributeType: 'S' as const },
          { AttributeName: 'username', AttributeType: 'S' as const }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'username-index',
            KeySchema: [
              { AttributeName: 'username', KeyType: 'HASH' as const }
            ],
            Projection: { ProjectionType: 'ALL' as const },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      };

      await this.dynamoClient.send(new CreateTableCommand(createTableParams));
      console.log(`Test table ${this.tableName} created successfully`);
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log(`Test table ${this.tableName} already exists`);
      } else {
        console.warn('Failed to create test table:', error.message);
      }
    }
  }

  async cleanupTestData(): Promise<void> {
    if (!await this.checkDynamoDBConnection()) {
      return;
    }

    try {
      // Scan and delete all test data
      const { ScanCommand, DeleteCommand } = await import('@aws-sdk/lib-dynamodb');

      const scanResult = await this.dynamoClient.send(new ScanCommand({
        TableName: this.tableName
      }));

      if (scanResult.Items && scanResult.Items.length > 0) {
        const deletePromises = scanResult.Items.map(item =>
          this.dynamoClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: { PK: item.PK, SK: item.SK }
          }))
        );

        await Promise.all(deletePromises);
        console.log(`Cleaned up ${scanResult.Items.length} test items`);
      }
    } catch (error: any) {
      console.warn('Failed to cleanup test data:', error.message);
    }
  }

  async teardownTestTable(): Promise<void> {
    if (!await this.checkDynamoDBConnection()) {
      return;
    }

    try {
      const { DeleteTableCommand } = await import('@aws-sdk/client-dynamodb');
      await this.dynamoClient.send(new DeleteTableCommand({
        TableName: this.tableName
      }));
      console.log(`Test table ${this.tableName} deleted successfully`);
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`Test table ${this.tableName} does not exist`);
      } else {
        console.warn('Failed to delete test table:', error.message);
      }
    }
  }

  // Test data factory methods
  createTestProfile(overrides: any = {}) {
    const userId = overrides.userId || `test-user-${Date.now()}`;
    return {
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
      userId,
      username: overrides.username || `testuser${Date.now()}`,
      email: overrides.email || `test${Date.now()}@example.com`,
      displayName: overrides.displayName || 'Test User',
      bio: overrides.bio || 'Test bio',
      avatar: overrides.avatar || '',
      followersCount: overrides.followersCount || 0,
      followingCount: overrides.followingCount || 0,
      postsCount: overrides.postsCount || 0,
      isVerified: overrides.isVerified || false,
      isPrivate: overrides.isPrivate || false,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      ...overrides
    };
  }

  createTestPost(userId: string, overrides: any = {}) {
    const postId = overrides.postId || `test-post-${Date.now()}`;
    return {
      PK: `USER#${userId}`,
      SK: `POST#${postId}`,
      postId,
      userId,
      content: overrides.content || 'Test post content',
      imageUrl: overrides.imageUrl || '',
      likesCount: overrides.likesCount || 0,
      commentsCount: overrides.commentsCount || 0,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      ...overrides
    };
  }

  async seedTestData(): Promise<{ profiles: any[], posts: any[] }> {
    const profiles = [];
    const posts = [];

    // Create 3 test users
    for (let i = 1; i <= 3; i++) {
      const profile = this.createTestProfile({
        userId: `test-user-${i}`,
        username: `testuser${i}`,
        email: `testuser${i}@example.com`,
        displayName: `Test User ${i}`,
        bio: `Bio for test user ${i}`,
        followersCount: Math.floor(Math.random() * 100),
        followingCount: Math.floor(Math.random() * 50),
        postsCount: 2,
        isVerified: i === 1 // First user is verified
      });

      profiles.push(profile);

      // Create 2 posts per user
      for (let j = 1; j <= 2; j++) {
        const post = this.createTestPost(profile.userId, {
          postId: `test-post-${i}-${j}`,
          content: `Test post ${j} from ${profile.displayName}`,
          likesCount: Math.floor(Math.random() * 20),
          commentsCount: Math.floor(Math.random() * 5)
        });

        posts.push(post);
      }
    }

    if (await this.checkDynamoDBConnection()) {
      try {
        const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

        // Insert profiles and posts
        const putPromises = [...profiles, ...posts].map(item =>
          this.dynamoClient.send(new PutCommand({
            TableName: this.tableName,
            Item: item
          }))
        );

        await Promise.all(putPromises);
        console.log(`Seeded ${profiles.length} profiles and ${posts.length} posts`);
      } catch (error: any) {
        console.warn('Failed to seed test data:', error.message);
      }
    }

    return { profiles, posts };
  }
}

// Global test environment instance
export const testEnvironment = new TestEnvironment();