import { GetCommand, TransactWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './clients.mjs';

/**
 * Follow data access operations
 */
export class FollowData {
  /**
   * Check if a user is following another user
   */
  static async checkFollowStatus(followerId, followedUserId) {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${followerId}`,
        SK: `FOLLOWS#${followedUserId}`,
      },
    }));
    return !!result.Item;
  }

  /**
   * Follow a user with atomic transaction
   */
  static async followUser(followerId, followedUserId) {
    const timestamp = new Date().toISOString();

    const transactItems = [
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${followerId}`,
            SK: `FOLLOWS#${followedUserId}`,
            followerId,
            followedUserId,
            createdAt: timestamp,
          },
          ConditionExpression: 'attribute_not_exists(PK)', // Prevent duplicate follows
        },
      },
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${followedUserId}`,
            SK: `FOLLOWER#${followerId}`,
            followerId,
            followedUserId,
            createdAt: timestamp,
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followerId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD followingCount :inc',
          ExpressionAttributeValues: {
            ':inc': 1,
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followedUserId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD followersCount :inc',
          ExpressionAttributeValues: {
            ':inc': 1,
          },
        },
      },
    ];

    await docClient.send(new TransactWriteCommand({
      TransactItems: transactItems,
    }));
  }

  /**
   * Unfollow a user with atomic transaction
   */
  static async unfollowUser(followerId, followedUserId) {
    const transactItems = [
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followerId}`,
            SK: `FOLLOWS#${followedUserId}`,
          },
          ConditionExpression: 'attribute_exists(PK)', // Ensure follow exists
        },
      },
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followedUserId}`,
            SK: `FOLLOWER#${followerId}`,
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followerId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD followingCount :dec',
          ExpressionAttributeValues: {
            ':dec': -1,
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followedUserId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD followersCount :dec',
          ExpressionAttributeValues: {
            ':dec': -1,
          },
        },
      },
    ];

    await docClient.send(new TransactWriteCommand({
      TransactItems: transactItems,
    }));
  }

  /**
   * Get followers of a user
   */
  static async getFollowers(userId, limit = 20) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'FOLLOWER#',
      },
      Limit: limit,
    }));

    return result.Items || [];
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(userId, limit = 20) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'FOLLOWS#',
      },
      Limit: limit,
    }));

    return result.Items || [];
  }
}