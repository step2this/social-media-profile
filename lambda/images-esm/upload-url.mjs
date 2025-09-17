import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS SDK clients with top-level await
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
  retryMode: 'adaptive',
});

// Pre-warm the connections with top-level await
await Promise.resolve();

const BUCKET_NAME = process.env.IMAGES_BUCKET_NAME;

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
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const requestBody = JSON.parse(event.body);
    const { fileName, fileType, userId } = requestBody;

    // Validate input
    if (!fileName || !fileType || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'fileName, fileType, and userId are required'
        }),
      };
    }

    // Validate file type (images only)
    if (!fileType.startsWith('image/')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Only image files are allowed'
        }),
      };
    }

    // Generate unique file key
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `users/${userId}/posts/${uniqueFileName}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        'uploaded-by': userId,
        'original-name': fileName,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300 // 5 minutes
    });

    // Generate the public URL for accessing the image
    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl,
        imageUrl,
        key,
        fileName: uniqueFileName,
      }),
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
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