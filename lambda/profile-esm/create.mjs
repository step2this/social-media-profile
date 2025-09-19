import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';

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

const eventBridgeClient = new EventBridgeClient({
  maxAttempts: 3,
  retryMode: 'adaptive',
});

// Pre-warm the connections with top-level await
await Promise.resolve();

const TABLE_NAME = process.env.TABLE_NAME;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

// TODO let's get rid of this kludgey handcrafted JSON and use a library instead
export const handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const request = JSON.parse(event.body);

    // Validate required fields
    if (!request.username || !request.email || !request.displayName) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({
          error: 'username, email, and displayName are required'
        }),
      };
    }

    const userId = uuidv4();
    const now = new Date().toISOString();

    const profile = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      userId,
      username: request.username,
      email: request.email,
      displayName: request.displayName,
      bio: request.bio || '',
      avatar: request.avatar || '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      isPrivate: false,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    // Store in DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: profile,
      ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwrites
    }));

    // Publish event to EventBridge
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        Source: 'social-media.profile',
        DetailType: 'Profile Created',
        Detail: JSON.stringify({
          userId,
          username: request.username,
          email: request.email,
          displayName: request.displayName,
          timestamp: now,
        }),
        EventBusName: EVENT_BUS_NAME,
      }],
    }));

    // Return profile (without internal fields)
    const responseProfile = {
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      postsCount: profile.postsCount,
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      createdAt: profile.createdAt,
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
      },
      body: JSON.stringify(responseProfile),
    };

  } catch (error) {
    console.error('Error creating profile:', error);

    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({ error: 'Profile already exists' }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
