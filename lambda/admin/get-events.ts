// lambda/admin/get-events.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { limit = '50', nextToken } = event.queryStringParameters || {};
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Cap at 100

    // For demo purposes, generate sample events
    // In production, you could integrate with CloudWatch Logs or store events in DynamoDB
    const events = generateSampleEvents(limitNum);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,GET'
      },
      body: JSON.stringify({
        events,
        totalEvents: events.length,
        nextToken: events.length >= limitNum ? `page-${Date.now()}` : undefined,
      }),
    };

  } catch (error) {
    console.error('Error getting events:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,GET'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        events: [],
        totalEvents: 0,
      }),
    };
  }
};

function generateSampleEvents(limit: number) {
  const sampleEvents = [];
  const sources = ['social-media.profiles', 'social-media.posts', 'social-media.follows', 'social-media.likes'];
  const detailTypes = ['Profile Created', 'Post Published', 'User Followed', 'Post Liked', 'Data Generated'];

  for (let i = 0; i < Math.min(limit, 10); i++) {
    const source = sources[i % sources.length];
    const detailType = detailTypes[i % detailTypes.length];

    sampleEvents.push({
      eventId: `sample-${Date.now()}-${i}`,
      source,
      detailType,
      detail: {
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        action: detailType.toLowerCase().replace(' ', '-'),
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'admin-demo',
          version: '1.0',
        },
      },
      timestamp: new Date(Date.now() - (i * 60000)).toISOString(), // Spread over last hour
      region: process.env.AWS_REGION || 'us-east-1',
      account: '123456789012',
    });
  }

  return sampleEvents.reverse(); // Most recent first
}