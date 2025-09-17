import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME!;

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

    const { userId } = event.pathParameters || {};

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId path parameter is required' }),
      };
    }

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
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Also query for posts by this user
    const postsQueryParams = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1', // Assuming GSI1 with GSI1PK and GSI1SK
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `USER#${userId}`,
      },
    };

    let postItems: any[] = [];
    try {
      const postsResult = await docClient.send(new QueryCommand(postsQueryParams));
      postItems = postsResult.Items || [];
    } catch (error) {
      console.log('No GSI or posts found for user:', error);
      // Continue without posts if GSI doesn't exist
    }

    // Collect all items to delete
    const itemsToDelete = [...userItems.Items, ...postItems];

    // Delete items in batches (max 100 per transaction)
    const batchSize = 25; // Conservative batch size for transactions
    const batches: any[][] = [];

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
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User deleted successfully',
        deletedItems: itemsToDelete.length,
        userId,
      }),
    };
  } catch (error) {
    console.error('Error deleting user:', error);
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