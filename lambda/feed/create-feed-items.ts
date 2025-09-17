import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME!;

interface FeedItem {
  followerId: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
}

interface CreateFeedItemsRequest {
  feedItems: FeedItem[];
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST'
        },
        body: JSON.stringify({
          error: 'Request body is required'
        }),
      };
    }

    const { feedItems }: CreateFeedItemsRequest = JSON.parse(event.body);

    if (!feedItems || !Array.isArray(feedItems) || feedItems.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'feedItems array is required and must not be empty'
        }),
      };
    }

    // Convert to DynamoDB items
    const timestampMs = Date.parse(feedItems[0].timestamp);
    const dynamoItems = feedItems.map(item => ({
      PK: `FEED#${item.followerId}`,
      SK: `POST#${timestampMs}#${item.postId}`,
      postId: item.postId,
      authorId: item.authorId,
      authorUsername: item.authorUsername,
      authorDisplayName: item.authorDisplayName,
      authorAvatar: item.authorAvatar,
      content: item.content,
      imageUrl: item.imageUrl,
      likesCount: 0,
      commentsCount: 0,
      createdAt: item.timestamp,
    }));

    // Batch write feed items (DynamoDB batch write supports max 25 items)
    const batches = [];
    for (let i = 0; i < dynamoItems.length; i += 25) {
      batches.push(dynamoItems.slice(i, i + 25));
    }

    let totalItemsCreated = 0;
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

      totalItemsCreated += batch.length;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
      },
      body: JSON.stringify({
        message: 'Feed items created successfully',
        itemsCreated: totalItemsCreated,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error: any) {
    console.error('Error creating feed items:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};