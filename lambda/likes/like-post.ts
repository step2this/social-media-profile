import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

interface LikePostRequest {
  userId: string;
  postId: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { userId, postId }: LikePostRequest = JSON.parse(event.body);

    if (!userId || !postId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId and postId are required' }),
      };
    }

    // Check if post exists
    const postResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POST#${postId}`,
        SK: 'METADATA',
      },
    }));

    if (!postResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Post not found' }),
      };
    }

    // Check if user already liked this post
    const existingLike = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POST#${postId}`,
        SK: `LIKE#${userId}`,
      },
    }));

    if (existingLike.Item) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Post already liked by user' }),
      };
    }

    const timestamp = new Date().toISOString();
    const post = postResult.Item;

    // Create like records and update counts in a transaction
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

    // Send event to EventBridge
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [
        {
          Source: 'social-media.likes',
          DetailType: 'Post Liked',
          Detail: JSON.stringify({
            userId,
            postId,
            postAuthorId: post.userId,
            postAuthorUsername: post.username,
            postContent: post.content,
            timestamp,
          }),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Post liked successfully',
        likesCount: (post.likesCount || 0) + 1,
      }),
    };
  } catch (error) {
    console.error('Error liking post:', error);
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