import { EventBridgeEvent } from 'aws-lambda';

const API_BASE_URL = process.env.API_BASE_URL!;

interface PostCreatedEvent {
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
}

interface FeedItem {
  followerId: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
}

// Helper function to make API calls
const makeApiCall = async (endpoint: string, method: string, body?: any) => {
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

export const handler = async (event: EventBridgeEvent<'Post Created', PostCreatedEvent>) => {
  try {
    const { postId, userId, username, displayName, avatar, content, imageUrl, timestamp } = event.detail;

    console.log(`Processing post created event for postId: ${postId}, userId: ${userId}`);

    // Get all followers of the user who created the post using API
    const followersResponse = await makeApiCall(`/social/followers/${userId}`, 'GET') as any;
    const followers = followersResponse.followers || [];

    console.log(`Found ${followers.length} followers for user ${userId}`);

    if (followers.length === 0) {
      console.log('No followers found, skipping feed generation');
      return;
    }

    // Create feed items for each follower
    const feedItems: FeedItem[] = followers.map((follower: any) => ({
      followerId: follower.followerId,
      postId,
      authorId: userId,
      authorUsername: username,
      authorDisplayName: displayName,
      authorAvatar: avatar,
      content,
      imageUrl,
      timestamp,
    }));

    // Create feed items using API
    await makeApiCall('/feed/items', 'POST', { feedItems });

    console.log(`Successfully created ${feedItems.length} feed items for post ${postId}`);
  } catch (error) {
    console.error('Error processing post created event:', error);
    throw error;
  }
};