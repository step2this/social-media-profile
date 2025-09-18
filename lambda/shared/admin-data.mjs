import { QueryCommand, DeleteCommand, TransactWriteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { docClient, s3Client, TABLE_NAME } from './clients.mjs';

/**
 * Admin data access operations
 */
export class AdminData {
  /**
   * Delete all items for a user (profile, posts, likes, follows, etc.)
   */
  static async deleteUser(userId) {
    // Query all items for this user
    const queryParams = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
      },
    };

    const userItems = await docClient.send(new QueryCommand(queryParams));

    if (!userItems.Items || userItems.Items.length === 0) {
      throw new Error('User not found');
    }

    // Also query for posts by this user using GSI1
    let postItems = [];
    try {
      const postsQueryParams = {
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `USER#${userId}`,
        },
      };

      const postsResult = await docClient.send(new QueryCommand(postsQueryParams));
      postItems = postsResult.Items || [];
    } catch (error) {
      console.log('No GSI or posts found for user:', error);
      // Continue without posts if GSI doesn't exist
    }

    // Collect all items to delete
    const itemsToDelete = [...userItems.Items, ...postItems];

    // Delete items in batches (max 25 per transaction)
    const batchSize = 25;
    const batches = [];

    for (let i = 0; i < itemsToDelete.length; i += batchSize) {
      batches.push(itemsToDelete.slice(i, i + batchSize));
    }

    // Execute deletions
    for (const batch of batches) {
      if (batch.length === 1) {
        // Single item delete
        await docClient.send(new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: batch[0].PK,
            SK: batch[0].SK,
          },
        }));
      } else {
        // Batch delete using transaction
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

    return {
      deletedItems: itemsToDelete.length,
      userId,
    };
  }

  /**
   * Delete all data in the table (cleanup all)
   */
  static async cleanupAll() {
    let deletedItems = 0;
    let lastEvaluatedKey;

    do {
      const scanParams = {
        TableName: TABLE_NAME,
        Limit: 25, // Process in small batches
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
      };

      const result = await docClient.send(new ScanCommand(scanParams));
      const items = result.Items || [];

      if (items.length > 0) {
        // Delete items in transaction
        const transactItems = items.map(item => ({
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

        deletedItems += items.length;
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return { deletedItems };
  }

  /**
   * Delete all objects from S3 bucket
   */
  static async cleanupS3(bucketName) {
    let deletedObjects = 0;

    try {
      const listResult = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
      }));

      if (listResult.Contents && listResult.Contents.length > 0) {
        await s3Client.send(new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: listResult.Contents.map(obj => ({ Key: obj.Key })),
          },
        }));
        deletedObjects = listResult.Contents.length;
      }
    } catch (error) {
      console.error('S3 cleanup error:', error);
      throw error;
    }

    return { deletedObjects };
  }
}