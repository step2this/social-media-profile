import { AdminData, createSuccessResponse, createErrorResponse, handleOptionsRequest } from '../shared/index.mjs';

// Pre-warm the connections with top-level await
await Promise.resolve();

const S3_BUCKET = process.env.S3_BUCKET;

export const handler = async (event) => {
  try {
    if (handleOptionsRequest(event)) {
      return handleOptionsRequest(event);
    }

    let deletedDynamoItems = 0;
    let deletedS3Objects = 0;

    // Clean up DynamoDB
    console.log('Cleaning up DynamoDB...');
    const dynamoResult = await AdminData.cleanupAll();
    deletedDynamoItems = dynamoResult.deletedItems;

    // Clean up S3 (if bucket is specified)
    if (S3_BUCKET) {
      console.log('Cleaning up S3...');
      try {
        const s3Result = await AdminData.cleanupS3(S3_BUCKET);
        deletedS3Objects = s3Result.deletedObjects;
      } catch (s3Error) {
        console.error('S3 cleanup error (continuing):', s3Error);
        // Continue even if S3 cleanup fails
      }
    }

    return createSuccessResponse({
      message: 'Cleanup completed successfully',
      deletedDynamoItems,
      deletedS3Objects,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return createErrorResponse('Failed to cleanup all data', error);
  }
};