import { PutCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './clients.mjs';
import { FollowData } from './follow-data.mjs';

/**
 * Feed data access operations
 */
export class FeedData {
  /**
   * Get user's feed
   */
  static async getUserFeed(userId, limit = 20) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `FEED#${userId}`,
        ':sk': 'POST#',
      },
      ScanIndexForward: false, // Sort by timestamp descending (newest first)
      Limit: limit,
    }));

    return result.Items || [];
  }

  /**
   * Add a feed item for a user
   */
  static async addFeedItem(userId, feedItem) {
    const timestamp = Date.now();
    const item = {
      PK: `FEED#${userId}`,
      SK: `POST#${timestamp}#${feedItem.postId}`,
      ...feedItem,
      feedTimestamp: timestamp,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));
  }

  /**
   * Create feed items for all followers when a post is created
   */
  static async createFeedItemsForPost(post) {
    // Get all followers of the post author
    const followers = await FollowData.getFollowers(post.userId, 1000); // Adjust limit as needed

    if (followers.length === 0) {
      return;
    }

    const timestamp = Date.now();
    const feedItem = {
      postId: post.postId,
      userId: post.userId,
      username: post.username,
      displayName: post.displayName,
      avatar: post.avatar,
      content: post.content,
      imageUrl: post.imageUrl,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
    };

    // Create feed items in batches to avoid transaction limits
    const batchSize = 25; // DynamoDB transaction limit is 25 items
    for (let i = 0; i < followers.length; i += batchSize) {
      const batch = followers.slice(i, i + batchSize);

      const transactItems = batch.map(follower => ({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `FEED#${follower.followerId}`,
            SK: `POST#${timestamp}#${post.postId}`,
            ...feedItem,
            feedTimestamp: timestamp,
          },
        },
      }));

      await docClient.send(new TransactWriteCommand({
        TransactItems: transactItems,
      }));
    }
  }

  /**
   * Remove feed items when a user unfollows another user
   */
  static async removeFeedItemsForUnfollow(followerId, unfollowedUserId) {
    // Query all feed items from the unfollowed user
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `FEED#${followerId}`,
        ':sk': 'POST#',
      },
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ...result.ExpressionAttributeValues,
        ':userId': unfollowedUserId,
      },
    }));

    const itemsToDelete = result.Items || [];
    if (itemsToDelete.length === 0) {
      return;
    }

    // Delete items in batches
    const batchSize = 25;
    for (let i = 0; i < itemsToDelete.length; i += batchSize) {
      const batch = itemsToDelete.slice(i, i + batchSize);

      const transactItems = batch.map(item => ({
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        },
      }));

      await docClient.send(new TransactWriteCommand({
        TransactItems: transactItems,
      }));
    }
  }
}