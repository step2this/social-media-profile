import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Successfully unfollowed user',
        followerId,
        followedUserId,
        timestamp,
      }),
    };
  } catch (error: any) {
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