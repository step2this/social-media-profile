# Test Environment Setup

This directory contains utilities for setting up and managing the test environment for the social media profile service.

## Components

### TestEnvironment Class (`test-environment.ts`)

The main class that manages test database connections, test data seeding, and cleanup operations.

**Features:**
- Configurable DynamoDB connection (local or mocked)
- Test table creation and management
- Test data factory methods
- Automatic cleanup utilities

**Usage in tests:**
```typescript
import { testEnvironment } from './environment/test-environment';

beforeAll(async () => {
  await testEnvironment.setupTestTable();
});

afterEach(async () => {
  await testEnvironment.cleanupTestData();
});
```

### Setup Script (`setup-tests.ts`)

Command-line utility for managing test environment lifecycle.

**Commands:**
```bash
# Set up test environment
npx ts-node test/environment/setup-tests.ts setup

# Clean up test data
npx ts-node test/environment/setup-tests.ts cleanup

# Tear down completely
npx ts-node test/environment/setup-tests.ts teardown
```

## Running Tests with Different Backends

### Option 1: Mocked DynamoDB (Default)
Tests will automatically use mocks when DynamoDB Local is not available:

```bash
npm test
```

### Option 2: DynamoDB Local
For integration testing with real DynamoDB:

1. **Install DynamoDB Local:**
   ```bash
   # Using Docker
   docker run -p 8000:8000 amazon/dynamodb-local

   # Or install locally
   npm install -g dynamodb-local
   dynamodb-local
   ```

2. **Set up test environment:**
   ```bash
   npx ts-node test/environment/setup-tests.ts setup
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Clean up:**
   ```bash
   npx ts-node test/environment/setup-tests.ts cleanup
   ```

## Test Data Structure

### Test Profiles
```typescript
{
  userId: 'test-user-1',
  username: 'testuser1',
  email: 'testuser1@example.com',
  displayName: 'Test User 1',
  bio: 'Bio for test user 1',
  followersCount: 0,
  followingCount: 0,
  postsCount: 2,
  isVerified: false,
  isPrivate: false
}
```

### Test Posts
```typescript
{
  postId: 'test-post-1-1',
  userId: 'test-user-1',
  content: 'Test post 1 from Test User 1',
  imageUrl: '',
  likesCount: 0,
  commentsCount: 0
}
```

## Environment Variables

- `DYNAMODB_ENDPOINT`: DynamoDB endpoint URL (default: http://localhost:8000)
- `TABLE_NAME`: Test table name (default: test-profiles)

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Start DynamoDB Local
  run: |
    docker run -d -p 8000:8000 amazon/dynamodb-local
    sleep 5

- name: Setup test environment
  run: npx ts-node test/environment/setup-tests.ts setup

- name: Run tests
  run: npm test

- name: Cleanup
  run: npx ts-node test/environment/setup-tests.ts cleanup
```

### Local Development
Add to package.json scripts:
```json
{
  "scripts": {
    "test:setup": "ts-node test/environment/setup-tests.ts setup",
    "test:cleanup": "ts-node test/environment/setup-tests.ts cleanup",
    "test:with-db": "npm run test:setup && npm test && npm run test:cleanup"
  }
}
```

## Best Practices

1. **Always clean up after tests:**
   ```typescript
   afterEach(async () => {
     await testEnvironment.cleanupTestData();
   });
   ```

2. **Use test data factories:**
   ```typescript
   const testProfile = testEnvironment.createTestProfile({
     username: 'customuser',
     isVerified: true
   });
   ```

3. **Isolate test data:**
   ```typescript
   const testUser = `test-user-${Date.now()}`;
   ```

4. **Check connection status:**
   ```typescript
   if (await testEnvironment.checkDynamoDBConnection()) {
     // Run integration tests
   } else {
     // Skip or mock
   }
   ```