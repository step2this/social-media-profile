import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './clients.mjs';

/**
 * Profile data access operations
 */
export class ProfileData {
  /**
   * Get a profile by userId
   */
  static async getProfileById(userId) {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    }));
    return result.Item;
  }

  /**
   * Get a profile by username using GSI
   */
  static async getProfileByUsername(username) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'username-index',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
      Limit: 1,
    }));
    return result.Items?.[0];
  }

  /**
   * Create a new profile
   */
  static async createProfile(profileData) {
    const timestamp = new Date().toISOString();
    const profile = {
      PK: `USER#${profileData.userId}`,
      SK: 'PROFILE',
      userId: profileData.userId,
      username: profileData.username,
      email: profileData.email,
      displayName: profileData.displayName,
      bio: profileData.bio || '',
      avatar: profileData.avatar || '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      isPrivate: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: profile,
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    return profile;
  }

  /**
   * Update a profile
   */
  static async updateProfile(userId, updates) {
    const timestamp = new Date().toISOString();

    // Build update expression dynamically
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = { ':updatedAt': timestamp };

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== 'userId') { // Don't allow updating userId
        const attributeName = `#${key}`;
        const attributeValue = `:val${index}`;
        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
      }
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes;
  }

  /**
   * Increment/decrement profile counters
   */
  static async updateProfileCounters(userId, counters) {
    const updateExpressions = [];
    const expressionAttributeValues = {};

    Object.entries(counters).forEach(([counter, value]) => {
      updateExpressions.push(`${counter} :${counter}`);
      expressionAttributeValues[`:${counter}`] = value;
    });

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `ADD ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
    }));
  }

  /**
   * Get public profile data (safe for API responses)
   */
  static getPublicProfile(profile) {
    if (!profile) return null;

    return {
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      postsCount: profile.postsCount,
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      createdAt: profile.createdAt,
    };
  }
}