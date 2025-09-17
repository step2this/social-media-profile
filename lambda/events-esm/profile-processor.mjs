// lambda/events-esm/profile-processor.mjs

// Pre-warm the connections with top-level await
await Promise.resolve();

export const handler = async (event) => {
  try {
    console.log('Processing profile event:', JSON.stringify(event, null, 2));

    switch (event['detail-type']) {
      case 'Profile Created':
        await handleProfileCreated(event.detail);
        break;

      case 'Profile Updated':
        await handleProfileUpdated(event.detail);
        break;

      default:
        console.warn('Unknown event type:', event['detail-type']);
    }

  } catch (error) {
    console.error('Error processing profile event:', error instanceof Error ? error.message : 'Unknown error');
    throw error; // Re-throw to trigger retry mechanism
  }
};

async function handleProfileCreated(detail) {
  console.log(`Profile created for user: ${detail.userId} (${detail.username})`);

  // Example event-driven tasks:
  // 1. Create search index entry
  // 2. Send welcome email
  // 3. Initialize analytics tracking
  // 4. Create default privacy settings

  // Simulate async operations
  await Promise.all([
    createSearchIndexEntry(detail),
    sendWelcomeEmail(detail),
    initializeAnalytics(detail),
  ]);
}

async function handleProfileUpdated(detail) {
  console.log(`Profile updated for user: ${detail.userId}`);
  console.log('Changes:', detail.changes);

  // Example event-driven tasks:
  // 1. Update search index
  // 2. Invalidate profile caches
  // 3. Update feed relevance scores
  // 4. Log analytics event

  await Promise.all([
    updateSearchIndex(detail),
    invalidateProfileCache(detail),
    updateFeedRelevance(detail),
  ]);
}

// Placeholder implementations - replace with actual services
async function createSearchIndexEntry(detail) {
  // TODO: Add user to ElasticSearch/OpenSearch for profile search
  console.log(`Creating search index for ${detail.username}`);

  // Example: Could index username, displayName, bio for search
  const searchDocument = {
    userId: detail.userId,
    username: detail.username,
    displayName: detail.displayName,
    type: 'profile',
    createdAt: detail.timestamp,
  };

  // await searchClient.index(searchDocument);
  console.log('Search document:', searchDocument);
}

async function sendWelcomeEmail(detail) {
  // TODO: Send welcome email via SES
  console.log(`Sending welcome email to ${detail.email}`);

  // await sesClient.sendEmail({
  //   to: detail.email,
  //   subject: 'Welcome to Social Media App!',
  //   body: `Hi ${detail.displayName}, welcome!`
  // });
}

async function initializeAnalytics(detail) {
  // TODO: Set up analytics tracking for new user
  console.log(`Initializing analytics for ${detail.userId}`);

  // Could create user segments, initialize tracking, etc.
}

async function updateSearchIndex(detail) {
  console.log(`Updating search index for user ${detail.userId}`);

  // Update searchable fields if they changed
  const searchableChanges = ['displayName', 'bio', 'isPrivate'];
  const hasSearchableChanges = Object.keys(detail.changes)
    .some(key => searchableChanges.includes(key));

  if (hasSearchableChanges) {
    console.log('Searchable fields changed, updating index');
    // await searchClient.update(detail.userId, detail.changes);
  }
}

async function invalidateProfileCache(detail) {
  console.log(`Invalidating cache for user ${detail.userId}`);

  // TODO: Invalidate Redis/ElastiCache entries
  const cacheKeys = [
    `profile:${detail.userId}`,
    `profile:public:${detail.userId}`,
  ];

  // await Promise.all(cacheKeys.map(key => cacheClient.del(key)));
  console.log('Cache keys to invalidate:', cacheKeys);
}

async function updateFeedRelevance(detail) {
  console.log(`Updating feed relevance for user ${detail.userId}`);

  // If privacy settings changed, might need to update who can see their content
  if ('isPrivate' in detail.changes) {
    console.log(`Privacy setting changed to: ${detail.changes.isPrivate}`);
    // TODO: Update feed algorithms, follower visibility, etc.
  }
}