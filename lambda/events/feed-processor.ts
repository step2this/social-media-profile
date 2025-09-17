import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME!;

interface PostCreatedEvent {
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
}

export const handler = async (event: EventBridgeEvent<'Post Created', PostCreatedEvent>) => {
  try {
    const { postId, userId, username, displayName, avatar, content, imageUrl, timestamp } = event.detail;

    console.log(`Processing post created event for postId: ${postId}, userId: ${userId}`);

    // Get all followers of the user who created the post
    const followersResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'FOLLOWER#',
      },
    }));

    const followers = followersResult.Items || [];
    console.log(`Found ${followers.length} followers for user ${userId}`);

    if (followers.length === 0) {
      console.log('No followers found, skipping feed generation');
      return;
    }

    // Create feed items for each follower
    const timestampMs = Date.parse(timestamp);
    const feedItems = followers.map(follower => ({
      PK: `FEED#${follower.followerId}`,
      SK: `POST#${timestampMs}#${postId}`,
      postId,
      authorId: userId,
      authorUsername: username,
      authorDisplayName: displayName,
      authorAvatar: avatar,
      content,
      imageUrl,
      likesCount: 0,
      commentsCount: 0,
      createdAt: timestamp,
    }));

    // Batch write feed items (DynamoDB batch write supports max 25 items)
    const batches = [];
    for (let i = 0; i < feedItems.length; i += 25) {
      batches.push(feedItems.slice(i, i + 25));
    }

    for (const batch of batches) {
      const putRequests = batch.map(item => ({
        PutRequest: {
          Item: item,
        },
      }));

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: putRequests,
        },
      }));
    }

    console.log(`Successfully created ${feedItems.length} feed items for post ${postId}`);
  } catch (error) {
    console.error('Error processing post created event:', error);
    throw error;
  }
};