import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { validateCreateFeedItemsRequest } from '../shared/schemas.mjs';

// Initialize AWS SDK clients with top-level await
const dynamoClient = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: 'adaptive',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Pre-warm the connections with top-level await
await Promise.resolve();

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Request body is required'
        }),
      };
    }

    const request = JSON.parse(event.body);

    // Validate request using shared schema
    const validation = validateCreateFeedItemsRequest(request);
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        }),
      };
    }

    const { feedItems } = request;

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
      headers,
      body: JSON.stringify({
        message: 'Feed items created successfully',
        itemsCreated: totalItemsCreated,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Error creating feed items:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};