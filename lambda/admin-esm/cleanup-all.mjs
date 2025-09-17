import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const dynamoClient = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: 'adaptive',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const s3Client = new S3Client({
  maxAttempts: 3,
  retryMode: 'adaptive',
});

// Pre-warm the connections with top-level await
await Promise.resolve();

const TABLE_NAME = process.env.TABLE_NAME;
const S3_BUCKET = process.env.S3_BUCKET;

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    let deletedDynamoItems = 0;
    let deletedS3Objects = 0;

    // Clean up DynamoDB
    console.log('Cleaning up DynamoDB...');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      const deletePromises = scanResult.Items.map(item =>
        docClient.send(new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }))
      );

      await Promise.all(deletePromises);
      deletedDynamoItems = scanResult.Items.length;
    }

    // Clean up S3
    console.log('Cleaning up S3...');
    try {
      const listResult = await s3Client.send(new ListObjectsV2Command({
        Bucket: S3_BUCKET
      }));

      if (listResult.Contents && listResult.Contents.length > 0) {
        await s3Client.send(new DeleteObjectsCommand({
          Bucket: S3_BUCKET,
          Delete: {
            Objects: listResult.Contents.map(obj => ({ Key: obj.Key }))
          }
        }));
        deletedS3Objects = listResult.Contents.length;
      }
    } catch (s3Error) {
      console.error('S3 cleanup error (continuing):', s3Error);
      // Continue even if S3 cleanup fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Cleanup completed successfully',
        deletedDynamoItems,
        deletedS3Objects,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};