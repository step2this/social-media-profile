import { createSuccessResponse, createErrorResponse, createValidationError, handleOptionsRequest } from '../shared/index.mjs';

// Pre-warm the connections with top-level await
await Promise.resolve();

export const handler = async (event) => {
  try {
    if (handleOptionsRequest(event)) {
      return handleOptionsRequest(event);
    }

    const { limit = '50', nextToken } = event.queryStringParameters || {};
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Cap at 100

    if (isNaN(limitNum) || limitNum < 1) {
      return createValidationError('Invalid limit parameter');
    }

    // For demo purposes, generate sample events
    // In production, you could integrate with CloudWatch Logs or store events in DynamoDB
    const events = generateSampleEvents(limitNum);

    return createSuccessResponse({
      events,
      totalEvents: events.length,
      nextToken: events.length >= limitNum ? `page-${Date.now()}` : undefined,
    });

  } catch (error) {
    console.error('Error getting events:', error);
    return createErrorResponse('Failed to get events', error);
  }
};

function generateSampleEvents(limit) {
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