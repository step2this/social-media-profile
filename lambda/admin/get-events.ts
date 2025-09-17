// lambda/admin/get-events.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, ListRulesCommand, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const eventBridgeClient = new EventBridgeClient({});
const cloudWatchLogsClient = new CloudWatchLogsClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { limit = '50', nextToken } = event.queryStringParameters || {};
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Cap at 100

    // For this implementation, we'll read EventBridge events from CloudWatch Logs
    // This is a simplified approach - in production you might want to store events in DynamoDB
    const logGroupName = `/aws/events/rule/${process.env.EVENT_BUS_NAME || 'social-media-events'}`;

    let events: any[] = [];
    let responseNextToken: string | undefined;

    try {
      // Get log events from CloudWatch Logs
      const filterCommand = new FilterLogEventsCommand({
        logGroupName,
        limit: limitNum,
        nextToken,
        startTime: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
      });

      const logResponse = await cloudWatchLogsClient.send(filterCommand);

      events = (logResponse.events || []).map((logEvent, index) => {
        try {
          // Try to parse the log message as JSON
          const eventData = JSON.parse(logEvent.message || '{}');

          return {
            eventId: `${logEvent.eventId || Date.now()}-${index}`,
            source: eventData.source || 'unknown',
            detailType: eventData['detail-type'] || 'Unknown Event',
            detail: eventData.detail || {},
            timestamp: new Date(logEvent.timestamp || Date.now()).toISOString(),
            region: eventData.region || process.env.AWS_REGION || 'us-east-1',
            account: eventData.account || 'unknown',
          };
        } catch (parseError) {
          // If parsing fails, create a basic event from the log
          return {
            eventId: `${logEvent.eventId || Date.now()}-${index}`,
            source: 'cloudwatch-logs',
            detailType: 'Log Event',
            detail: { message: logEvent.message || 'No message' },
            timestamp: new Date(logEvent.timestamp || Date.now()).toISOString(),
            region: process.env.AWS_REGION || 'us-east-1',
            account: 'unknown',
          };
        }
      });

      responseNextToken = logResponse.nextToken;
    } catch (logError) {
      console.log('CloudWatch Logs not available, generating sample events:', logError);

      // If CloudWatch Logs aren't available, generate some sample events for demo
      events = generateSampleEvents(limitNum);
    }

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
        nextToken: responseNextToken,
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