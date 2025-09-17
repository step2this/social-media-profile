// lambda/events-esm/feed-processor.mjs

const API_BASE_URL = process.env.API_BASE_URL;

// Pre-warm the connections with top-level await
await Promise.resolve();

// Helper function to make API calls
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
    const { postId, userId, username, displayName, avatar, content, imageUrl, timestamp } = event.detail;

    console.log(`Processing post created event for postId: ${postId}, userId: ${userId}`);

    // Get all followers of the user who created the post using API
    const followersResponse = await makeApiCall(`/social/followers/${userId}`, 'GET');
    const followers = followersResponse.followers || [];

    console.log(`Found ${followers.length} followers for user ${userId}`);

    if (followers.length === 0) {
      console.log('No followers found, skipping feed generation');
      return;
    }

    // Create feed items for each follower
    const feedItems = followers.map((follower) => ({
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
    console.error('Error processing post created event:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};