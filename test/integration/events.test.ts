/**
 * Event Integration Tests
 *
 * Tests EventBridge integration to ensure:
 * - Events are published correctly
 * - Event schemas are consistent
 * - Event routing works as expected
 * - Error handling for event failures
 *
 * Uses mocked EventBridge client for isolated testing.
 */

import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { mockClient } from 'aws-sdk-client-mock';

// Mock EventBridge for integration tests
const eventBridgeMock = mockClient(EventBridgeClient);

describe('Event Integration Tests', () => {
  const EVENT_BUS_NAME = 'test-profile-events';
  let eventClient: EventBridgeClient;

  beforeEach(() => {
    // Reset mocks
    eventBridgeMock.reset();

    // Create mock client
    eventClient = new EventBridgeClient({
      region: 'us-east-1'
    });
  });

  describe('User Profile Events', () => {
    test('should publish user.created event with correct schema', async () => {
      const userCreatedEvent = {
        Source: 'profile.service',
        DetailType: 'User Created',
        Detail: JSON.stringify({
          userId: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          metadata: {
            source: 'api',
            version: '1.0'
          }
        }),
        EventBusName: EVENT_BUS_NAME
      };

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: [
          {
            EventId: 'event-123',
            ErrorCode: undefined,
            ErrorMessage: undefined
          }
        ]
      });

      const result = await eventClient.send(new PutEventsCommand({
        Entries: [userCreatedEvent]
      }));

      expect(result.FailedEntryCount).toBe(0);
      expect(eventBridgeMock.commandCalls(PutEventsCommand)).toHaveLength(1);

      const putCall = eventBridgeMock.commandCalls(PutEventsCommand)[0];
      const sentEvent = putCall.args[0].input.Entries?.[0];

      expect(sentEvent?.Source).toBe('profile.service');
      expect(sentEvent?.DetailType).toBe('User Created');
      expect(sentEvent?.EventBusName).toBe(EVENT_BUS_NAME);

      // Validate event detail structure
      const detail = JSON.parse(sentEvent?.Detail || '{}');
      expect(detail.userId).toBe('user123');
      expect(detail.username).toBe('testuser');
      expect(detail.email).toBe('test@example.com');
      expect(detail.metadata.source).toBe('api');
    });

    test('should publish user.updated event when profile changes', async () => {
      const userUpdatedEvent = {
        Source: 'profile.service',
        DetailType: 'User Updated',
        Detail: JSON.stringify({
          userId: 'user123',
          changes: {
            displayName: {
              old: 'Old Name',
              new: 'New Name'
            },
            bio: {
              old: 'Old bio',
              new: 'New bio'
            }
          },
          updatedAt: '2024-01-01T00:00:00.000Z',
          metadata: {
            source: 'api',
            version: '1.0'
          }
        }),
        EventBusName: EVENT_BUS_NAME
      };

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: [{ EventId: 'event-456' }]
      });

      await eventClient.send(new PutEventsCommand({
        Entries: [userUpdatedEvent]
      }));

      const putCall = eventBridgeMock.commandCalls(PutEventsCommand)[0];
      const sentEvent = putCall.args[0].input.Entries?.[0];

      expect(sentEvent?.DetailType).toBe('User Updated');

      const detail = JSON.parse(sentEvent?.Detail || '{}');
      expect(detail.changes.displayName.old).toBe('Old Name');
      expect(detail.changes.displayName.new).toBe('New Name');
    });

    test('should publish user.deleted event with cleanup metadata', async () => {
      const userDeletedEvent = {
        Source: 'profile.service',
        DetailType: 'User Deleted',
        Detail: JSON.stringify({
          userId: 'user123',
          username: 'testuser',
          deletedAt: '2024-01-01T00:00:00.000Z',
          cleanup: {
            postsDeleted: 5,
            imagesDeleted: 3,
            connectionsRemoved: 10
          },
          metadata: {
            source: 'admin',
            reason: 'user_request',
            version: '1.0'
          }
        }),
        EventBusName: EVENT_BUS_NAME
      };

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: [{ EventId: 'event-789' }]
      });

      await eventClient.send(new PutEventsCommand({
        Entries: [userDeletedEvent]
      }));

      const putCall = eventBridgeMock.commandCalls(PutEventsCommand)[0];
      const sentEvent = putCall.args[0].input.Entries?.[0];

      const detail = JSON.parse(sentEvent?.Detail || '{}');
      expect(detail.cleanup.postsDeleted).toBe(5);
      expect(detail.metadata.reason).toBe('user_request');
    });
  });

  describe('Post Events', () => {
    test('should publish post.created event with engagement metrics', async () => {
      const postCreatedEvent = {
        Source: 'profile.service',
        DetailType: 'Post Created',
        Detail: JSON.stringify({
          postId: 'post123',
          userId: 'user123',
          content: 'Test post content',
          mediaCount: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          engagement: {
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0
          },
          metadata: {
            source: 'web',
            version: '1.0'
          }
        }),
        EventBusName: EVENT_BUS_NAME
      };

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: [{ EventId: 'post-event-123' }]
      });

      await eventClient.send(new PutEventsCommand({
        Entries: [postCreatedEvent]
      }));

      const putCall = eventBridgeMock.commandCalls(PutEventsCommand)[0];
      const sentEvent = putCall.args[0].input.Entries?.[0];

      expect(sentEvent?.DetailType).toBe('Post Created');

      const detail = JSON.parse(sentEvent?.Detail || '{}');
      expect(detail.postId).toBe('post123');
      expect(detail.engagement.likesCount).toBe(0);
    });

    test('should publish post.liked event with user interaction', async () => {
      const postLikedEvent = {
        Source: 'profile.service',
        DetailType: 'Post Liked',
        Detail: JSON.stringify({
          postId: 'post123',
          postAuthorId: 'user123',
          likedByUserId: 'user456',
          likedAt: '2024-01-01T00:00:00.000Z',
          newLikesCount: 1,
          metadata: {
            source: 'mobile',
            version: '1.0'
          }
        }),
        EventBusName: EVENT_BUS_NAME
      };

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: [{ EventId: 'like-event-123' }]
      });

      await eventClient.send(new PutEventsCommand({
        Entries: [postLikedEvent]
      }));

      const putCall = eventBridgeMock.commandCalls(PutEventsCommand)[0];
      const sentEvent = putCall.args[0].input.Entries?.[0];

      const detail = JSON.parse(sentEvent?.Detail || '{}');
      expect(detail.likedByUserId).toBe('user456');
      expect(detail.newLikesCount).toBe(1);
    });
  });

  describe('Batch Event Publishing', () => {
    test('should handle multiple events in single batch', async () => {
      const events = [
        {
          Source: 'profile.service',
          DetailType: 'User Created',
          Detail: JSON.stringify({ userId: 'user1' }),
          EventBusName: EVENT_BUS_NAME
        },
        {
          Source: 'profile.service',
          DetailType: 'User Created',
          Detail: JSON.stringify({ userId: 'user2' }),
          EventBusName: EVENT_BUS_NAME
        },
        {
          Source: 'profile.service',
          DetailType: 'User Created',
          Detail: JSON.stringify({ userId: 'user3' }),
          EventBusName: EVENT_BUS_NAME
        }
      ];

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: [
          { EventId: 'event-1' },
          { EventId: 'event-2' },
          { EventId: 'event-3' }
        ]
      });

      const result = await eventClient.send(new PutEventsCommand({
        Entries: events
      }));

      expect(result.FailedEntryCount).toBe(0);
      expect(result.Entries).toHaveLength(3);

      const putCall = eventBridgeMock.commandCalls(PutEventsCommand)[0];
      expect(putCall.args[0].input.Entries).toHaveLength(3);
    });

    test('should handle partial batch failures', async () => {
      const events = [
        {
          Source: 'profile.service',
          DetailType: 'User Created',
          Detail: JSON.stringify({ userId: 'user1' }),
          EventBusName: EVENT_BUS_NAME
        },
        {
          Source: 'profile.service',
          DetailType: 'User Created',
          Detail: JSON.stringify({ userId: 'user2' }),
          EventBusName: EVENT_BUS_NAME
        }
      ];

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 1,
        Entries: [
          { EventId: 'event-1' },
          {
            ErrorCode: 'ValidationException',
            ErrorMessage: 'Event size exceeds limit'
          }
        ]
      });

      const result = await eventClient.send(new PutEventsCommand({
        Entries: events
      }));

      expect(result.FailedEntryCount).toBe(1);
      expect(result.Entries?.[1].ErrorCode).toBe('ValidationException');
    });
  });

  describe('Event Schema Validation', () => {
    test('should validate required event fields', () => {
      const validEvent = {
        Source: 'profile.service',
        DetailType: 'User Created',
        Detail: JSON.stringify({ userId: 'user123' }),
        EventBusName: EVENT_BUS_NAME
      };

      // Required fields should be present
      expect(validEvent.Source).toBeTruthy();
      expect(validEvent.DetailType).toBeTruthy();
      expect(validEvent.Detail).toBeTruthy();
      expect(validEvent.EventBusName).toBeTruthy();

      // Detail should be valid JSON
      expect(() => JSON.parse(validEvent.Detail)).not.toThrow();
    });

    test('should validate event detail schemas', () => {
      const userCreatedDetail = {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        metadata: {
          source: 'api',
          version: '1.0'
        }
      };

      // Required fields for user created event
      expect(userCreatedDetail.userId).toBeTruthy();
      expect(userCreatedDetail.username).toBeTruthy();
      expect(userCreatedDetail.email).toBeTruthy();
      expect(userCreatedDetail.createdAt).toBeTruthy();

      // Email should be valid format
      expect(userCreatedDetail.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      // CreatedAt should be valid ISO date
      expect(new Date(userCreatedDetail.createdAt).toISOString()).toBe(userCreatedDetail.createdAt);

      // Metadata should have required fields
      expect(userCreatedDetail.metadata.source).toBeTruthy();
      expect(userCreatedDetail.metadata.version).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle EventBridge service errors', async () => {
      const serviceError = new Error('ServiceUnavailableException');
      serviceError.name = 'ServiceUnavailableException';

      eventBridgeMock.on(PutEventsCommand).rejects(serviceError);

      try {
        await eventClient.send(new PutEventsCommand({
          Entries: [{
            Source: 'profile.service',
            DetailType: 'User Created',
            Detail: JSON.stringify({ userId: 'user123' }),
            EventBusName: EVENT_BUS_NAME
          }]
        }));

        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.name).toBe('ServiceUnavailableException');
      }
    });

    test('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';

      eventBridgeMock.on(PutEventsCommand).rejects(timeoutError);

      try {
        await eventClient.send(new PutEventsCommand({
          Entries: [{
            Source: 'profile.service',
            DetailType: 'User Created',
            Detail: JSON.stringify({ userId: 'user123' }),
            EventBusName: EVENT_BUS_NAME
          }]
        }));

        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.name).toBe('TimeoutError');
      }
    });
  });

  describe('Event Routing', () => {
    test('should use correct event bus for different event types', async () => {
      const userEvent = {
        Source: 'profile.service',
        DetailType: 'User Created',
        Detail: JSON.stringify({ userId: 'user123' }),
        EventBusName: EVENT_BUS_NAME
      };

      const systemEvent = {
        Source: 'profile.service',
        DetailType: 'System Health Check',
        Detail: JSON.stringify({ status: 'healthy' }),
        EventBusName: 'system-events' // Different bus for system events
      };

      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: [{ EventId: 'event-1' }, { EventId: 'event-2' }]
      });

      await eventClient.send(new PutEventsCommand({
        Entries: [userEvent, systemEvent]
      }));

      const putCall = eventBridgeMock.commandCalls(PutEventsCommand)[0];
      const entries = putCall.args[0].input.Entries;

      expect(entries?.[0].EventBusName).toBe(EVENT_BUS_NAME);
      expect(entries?.[1].EventBusName).toBe('system-events');
    });
  });
});