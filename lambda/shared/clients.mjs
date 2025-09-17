import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { S3Client } from '@aws-sdk/client-s3';

// Initialize DynamoDB client with optimized settings
const dynamoClient = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: 'adaptive',
});

// Create document client with standard marshalling options
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Initialize EventBridge client
export const eventBridgeClient = new EventBridgeClient({
  maxAttempts: 3,
  retryMode: 'adaptive',
});

// Initialize S3 client
export const s3Client = new S3Client({
  maxAttempts: 3,
  retryMode: 'adaptive',
});

// Pre-warm connections with top-level await
await Promise.resolve();

// Environment variables
export const TABLE_NAME = process.env.TABLE_NAME;
export const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;
export const IMAGES_BUCKET_NAME = process.env.IMAGES_BUCKET_NAME;
export const S3_BUCKET = process.env.S3_BUCKET;
export const API_BASE_URL = process.env.API_BASE_URL;