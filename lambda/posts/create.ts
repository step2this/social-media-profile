import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, TransactWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { userId, content, imageUrl } = JSON.parse(event.body || '{}');

    if (!userId || !content) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing userId or content' }),
      };
    }

    // Get user profile for post metadata
    const profileResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    }));

    if (!profileResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'User profile not found' }),
      };
    }

    const profile = profileResult.Item;
    const postId = uuidv4();
    const timestamp = new Date().toISOString();
    const timestampMs = Date.now();

    const post = {
      PK: `POST#${postId}`,
      SK: 'METADATA',
      postId,
      userId,
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.avatar || '',
      content,
      imageUrl: imageUrl || undefined,
      likesCount: 0,
      commentsCount: 0,
      createdAt: timestamp,
    };

    const userPost = {
      PK: `USER#${userId}`,
      SK: `POST#${timestampMs}#${postId}`,
      postId,
      content,
      imageUrl: imageUrl || undefined,
      createdAt: timestamp,
    };

    // Create post using transaction
    const transactItems = [
      {
        Put: {
          TableName: TABLE_NAME,
          Item: post,
        },
      },
      {
        Put: {
          TableName: TABLE_NAME,
          Item: userPost,
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

    // Send event to EventBridge for feed generation
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [
        {
          Source: 'social-media.posts',
          DetailType: 'Post Created',
          Detail: JSON.stringify({
            postId,
            userId,
            username: profile.username,
            displayName: profile.displayName,
            avatar: profile.avatar || '',
            content,
            imageUrl: imageUrl || undefined,
            timestamp,
          }),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    }));

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(post),
    };
  } catch (error: any) {
    console.error('Error creating post:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};