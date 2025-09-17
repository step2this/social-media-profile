import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, TransactWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME!;

interface CreatePostRequest {
  userId: string;
  content: string;
  imageUrl?: string;
  userProfile: {
    username: string;
    displayName: string;
    avatar?: string;
  };
}

interface PostEntity {
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { action } = event.pathParameters || {};

    switch (action) {
      case 'create':
        return await handleCreatePost(event);
      case 'get':
        return await handleGetPost(event);
      default:
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error: any) {
    console.error('Error in posts-data-service:', error);

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

const handleCreatePost = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { userId, content, imageUrl, userProfile }: CreatePostRequest = JSON.parse(event.body || '{}');

  if (!userId || !content || !userProfile) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Missing required fields: userId, content, or userProfile' }),
    };
  }

  const postId = uuidv4();
  const timestamp = new Date().toISOString();
  const timestampMs = Date.now();

  const post: PostEntity = {
    postId,
    userId,
    username: userProfile.username,
    displayName: userProfile.displayName,
    avatar: userProfile.avatar || '',
    content,
    imageUrl,
    likesCount: 0,
    commentsCount: 0,
    createdAt: timestamp,
  };

  const postItem = {
    PK: `POST#${postId}`,
    SK: 'METADATA',
    ...post,
  };

  const userPostItem = {
    PK: `USER#${userId}`,
    SK: `POST#${timestampMs}#${postId}`,
    postId,
    content,
    imageUrl,
    createdAt: timestamp,
  };

  const transactItems = [
    {
      Put: {
        TableName: TABLE_NAME,
        Item: postItem,
      },
    },
    {
      Put: {
        TableName: TABLE_NAME,
        Item: userPostItem,
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

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(post),
  };
};

const handleGetPost = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { postId } = event.queryStringParameters || {};

  if (!postId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Missing postId parameter' }),
    };
  }

  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `POST#${postId}`,
      SK: 'METADATA',
    },
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Post not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(result.Item),
  };
};