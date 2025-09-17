import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { eventBridgeClient, EVENT_BUS_NAME } from './clients.mjs';

/**
 * Send an event to EventBridge
 */
export async function publishEvent(source, detailType, detail) {
  const command = new PutEventsCommand({
    Entries: [
      {
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(detail),
        EventBusName: EVENT_BUS_NAME,
      },
    ],
  });

  return await eventBridgeClient.send(command);
}

/**
 * Publish profile-related events
 */
export const ProfileEvents = {
  profileCreated: (userId, profile) =>
    publishEvent('social-media.profiles', 'Profile Created', { userId, profile, timestamp: new Date().toISOString() }),

  profileUpdated: (userId, updates, previousProfile) =>
    publishEvent('social-media.profiles', 'Profile Updated', { userId, updates, previousProfile, timestamp: new Date().toISOString() }),
};

/**
 * Publish post-related events
 */
export const PostEvents = {
  postCreated: (post) =>
    publishEvent('social-media.posts', 'Post Created', { ...post, timestamp: new Date().toISOString() }),

  postDeleted: (postId, userId) =>
    publishEvent('social-media.posts', 'Post Deleted', { postId, userId, timestamp: new Date().toISOString() }),
};

/**
 * Publish like-related events
 */
export const LikeEvents = {
  postLiked: (userId, postId, postAuthorId, postAuthorUsername, postContent) =>
    publishEvent('social-media.likes', 'Post Liked', {
      userId,
      postId,
      postAuthorId,
      postAuthorUsername,
      postContent,
      timestamp: new Date().toISOString(),
    }),

  postUnliked: (userId, postId, postAuthorId) =>
    publishEvent('social-media.likes', 'Post Unliked', {
      userId,
      postId,
      postAuthorId,
      timestamp: new Date().toISOString(),
    }),
};

/**
 * Publish follow-related events
 */
export const FollowEvents = {
  userFollowed: (followerId, followedUserId) =>
    publishEvent('social-media.follows', 'User Followed', {
      followerId,
      followedUserId,
      timestamp: new Date().toISOString(),
    }),

  userUnfollowed: (followerId, followedUserId) =>
    publishEvent('social-media.follows', 'User Unfollowed', {
      followerId,
      followedUserId,
      timestamp: new Date().toISOString(),
    }),
};