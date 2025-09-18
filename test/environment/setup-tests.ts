#!/usr/bin/env ts-node

import { testEnvironment } from './test-environment';

async function setupTests() {
  console.log('Setting up test environment...');

  try {
    // Check if DynamoDB Local is running
    const isDynamoAvailable = await testEnvironment.checkDynamoDBConnection();

    if (isDynamoAvailable) {
      console.log('✓ DynamoDB Local detected');

      // Set up test table
      await testEnvironment.setupTestTable();

      // Seed with test data
      const { profiles, posts } = await testEnvironment.seedTestData();
      console.log(`✓ Seeded ${profiles.length} profiles and ${posts.length} posts`);
    } else {
      console.log('ℹ Using mocked DynamoDB for tests');
    }

    console.log('✓ Test environment setup complete');
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    process.exit(1);
  }
}

async function teardownTests() {
  console.log('Tearing down test environment...');

  try {
    // Clean up test data
    await testEnvironment.cleanupTestData();

    // Optionally remove test table (uncomment if needed)
    // await testEnvironment.teardownTestTable();

    console.log('✓ Test environment cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupTests();
    break;
  case 'teardown':
    teardownTests();
    break;
  case 'cleanup':
    teardownTests();
    break;
  default:
    console.log('Usage: ts-node setup-tests.ts [setup|teardown|cleanup]');
    console.log('');
    console.log('Commands:');
    console.log('  setup    - Create test table and seed test data');
    console.log('  teardown - Clean up test data');
    console.log('  cleanup  - Same as teardown');
    process.exit(1);
}