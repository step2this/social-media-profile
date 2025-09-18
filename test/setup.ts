// Global test setup
process.env.NODE_ENV = 'test';
process.env.TABLE_NAME = 'test-table';
process.env.EVENT_BUS_NAME = 'test-event-bus';
process.env.AWS_REGION = 'us-east-1';

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-eventbridge');
jest.mock('@aws-sdk/client-s3');

// Extend Jest timeout for integration tests
jest.setTimeout(30000);