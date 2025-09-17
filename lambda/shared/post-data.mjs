import { GetCommand, PutCommand, TransactWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './clients.mjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Post data access operations
 */
export class PostData {
  /**
   * Get a post by postId
   */
  static async getPostById(postId) {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POST#${postId}`,
        SK: 'METADATA',
      },
    }));
    return result.Item;
  }

  /**
   * Create a new post with atomic transaction
   */
  static async createPost({ userId, content, imageUrl, userProfile }) {
    const postId = uuidv4();
    const timestamp = new Date().toISOString();
    const timestampMs = Date.now();

    const post = {
      postId,
      userId,
      username: userProfile.username,
      displayName: userProfile.displayName,
      avatar: userProfile.avatar || '',
      content,
      imageUrl,
      likesCount: 0,
      commentsCount: 0,
      createdAt: timestamp,
    };

    const postItem = {
      PK: `POST#${postId}`,
      SK: 'METADATA',
      ...post,
    };

    const userPostItem = {
      PK: `USER#${userId}`,
      SK: `POST#${timestampMs}#${postId}`,
      postId,
      content,
      imageUrl,
      createdAt: timestamp,
    };

    const transactItems = [
      {
        Put: {
          TableName: TABLE_NAME,
          Item: postItem,
        },
      },
      {
        Put: {
          TableName: TABLE_NAME,
          Item: userPostItem,
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD postsCount :inc',
          ExpressionAttributeValues: {
            ':inc': 1,
          },
        },
      },
    ];

    await docClient.send(new TransactWriteCommand({
      TransactItems: transactItems,
    }));

    return post;
  }

  /**
   * Get posts by user ID
   */
  static async getUserPosts(userId, limit = 20) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'POST#',
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: limit,
    }));

    return result.Items || [];
  }

  /**
   * Update post like count
   */
  static async updateLikeCount(postId, increment) {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POST#${postId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'ADD likesCount :inc',
      ExpressionAttributeValues: {
        ':inc': increment,
      },
    }));
  }

  /**
   * Delete a post (admin function)
   */
  static async deletePost(postId, userId) {
    const transactItems = [
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `POST#${postId}`,
            SK: 'METADATA',
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD postsCount :dec',
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