import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { followerId, followedUserId } = JSON.parse(event.body || '{}');

    if (!followerId || !followedUserId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing followerId or followedUserId' }),
      };
    }

    if (followerId === followedUserId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Cannot follow yourself' }),
      };
    }

    const timestamp = new Date().toISOString();

    // Create follow relationship using transaction
    const transactItems = [
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${followerId}`,
            SK: `FOLLOWS#${followedUserId}`,
            followerId,
            followedUserId,
            createdAt: timestamp,
          },
          ConditionExpression: 'attribute_not_exists(PK)', // Prevent duplicate follows
        },
      },
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${followedUserId}`,
            SK: `FOLLOWER#${followerId}`,
            followerId,
            followedUserId,
            createdAt: timestamp,
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
          UpdateExpression: 'ADD followingCount :inc',
          ExpressionAttributeValues: {
            ':inc': 1,
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
          UpdateExpression: 'ADD followersCount :inc',
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
          Source: 'social-media.follow',
          DetailType: 'User Followed',
          Detail: JSON.stringify({
            followerId,
            followedUserId,
            timestamp,
          }),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Successfully followed user',
        followerId,
        followedUserId,
        createdAt: timestamp,
      }),
    };
  } catch (error: any) {
    console.error('Error following user:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Already following this user' }),
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