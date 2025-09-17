import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

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
const API_BASE_URL = process.env.API_BASE_URL;

const makeApiCall = async (endpoint, method, body) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

export const handler = async (event) => {
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

    // Create post using posts-data-service
    const post = await makeApiCall('/data/posts/create', 'POST', {
      userId,
      content,
      imageUrl,
      userProfile: {
        username: profile.username,
        displayName: profile.displayName,
        avatar: profile.avatar || '',
      },
    });

    // Send event to EventBridge for feed generation
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [
        {
          Source: 'social-media.posts',
          DetailType: 'Post Created',
          Detail: JSON.stringify({
            postId: post.postId,
            userId,
            username: profile.username,
            displayName: profile.displayName,
            avatar: profile.avatar || '',
            content,
            imageUrl: imageUrl || undefined,
            timestamp: post.createdAt,
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
  } catch (error) {
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