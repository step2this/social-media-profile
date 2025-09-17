import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

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
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    const { page = '1', limit = '10' } = event.queryStringParameters || {};
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);

    // Scan for all users (PROFILE items only)
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': 'PROFILE',
      },
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    const users = result.Items || [];

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate pagination
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / pageLimit);
    const startIndex = (pageNumber - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        users: paginatedUsers,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalUsers,
          pageSize: pageLimit,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
      }),
    };
  } catch (error) {
    console.error('Error listing users:', error);
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