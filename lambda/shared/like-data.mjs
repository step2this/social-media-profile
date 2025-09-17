import { GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './clients.mjs';

/**
 * Like data access operations
 */
export class LikeData {
  /**
   * Check if a user has liked a post
   */
  static async checkLikeStatus(userId, postId) {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POST#${postId}`,
        SK: `LIKE#${userId}`,
      },
    }));
    return !!result.Item;
  }

  /**
   * Like a post with atomic transaction
   */
  static async likePost(userId, postId) {
    const timestamp = new Date().toISOString();

    const transactItems = [
      // Add like record to post
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `POST#${postId}`,
            SK: `LIKE#${userId}`,
            postId,
            userId,
            createdAt: timestamp,
          },
          ConditionExpression: 'attribute_not_exists(PK)', // Prevent duplicate likes
        },
      },
      // Add like to user's likes
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `LIKED#${postId}`,
            postId,
            userId,
            createdAt: timestamp,
          },
        },
      },
      // Increment like count on post metadata
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `POST#${postId}`,
            SK: 'METADATA',
          },
          UpdateExpression: 'ADD likesCount :inc',
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
   * Unlike a post with atomic transaction
   */
  static async unlikePost(userId, postId) {
    const transactItems = [
      // Remove like record from post
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `POST#${postId}`,
            SK: `LIKE#${userId}`,
          },
          ConditionExpression: 'attribute_exists(PK)', // Ensure like exists
        },
      },
      // Remove like from user's likes
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `LIKED#${postId}`,
          },
        },
      },
      // Decrement like count on post metadata
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `POST#${postId}`,
            SK: 'METADATA',
          },
          UpdateExpression: 'ADD likesCount :dec',
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
}