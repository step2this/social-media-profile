import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { validateFollowRequest, createFollowActionResponse } from '../shared/schemas.mjs';

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

export const handler = async (event) => {
  try {
    const request = JSON.parse(event.body || '{}');

    // Validate request using shared schema
    const validation = validateFollowRequest(request);
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        }),
      };
    }

    const { followerId, followedUserId } = request;

    const timestamp = new Date().toISOString();

    // Remove follow relationship using transaction
    const transactItems = [
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followerId}`,
            SK: `FOLLOWS#${followedUserId}`,
          },
          ConditionExpression: 'attribute_exists(PK)', // Ensure follow exists
        },
      },
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followedUserId}`,
            SK: `FOLLOWER#${followerId}`,
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followerId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD followingCount :dec',
          ExpressionAttributeValues: {
            ':dec': -1,
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${followedUserId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'ADD followersCount :dec',
          ExpressionAttributeValues: {
            ':dec': -1,
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
          Source: 'social-media.follow',
          DetailType: 'User Unfollowed',
          Detail: JSON.stringify({
            followerId,
            followedUserId,
            timestamp,
          }),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    }));

    // Format response using shared helper
    const response = createFollowActionResponse(false, followerId, followedUserId, timestamp);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error unfollowing user:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Not following this user' }),
      };
    }

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