// lambda/profile/update.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPrivate?: boolean;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { userId } = event.pathParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({ error: 'userId path parameter is required' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const updates: UpdateProfileRequest = JSON.parse(event.body);
    
    // Validate that at least one field is being updated
    const allowedFields = ['displayName', 'bio', 'avatar', 'isPrivate'];
    const providedFields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (providedFields.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({
          error: 'At least one field must be provided for update',
          allowedFields
        }),
      };
    }

    // Get current profile for event publishing
    const currentProfile = await docClient.send(new GetCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    }));

    if (!currentProfile.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({ error: 'Profile not found' }),
      };
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.displayName !== undefined) {
      updateExpressions.push('#displayName = :displayName');
      expressionAttributeNames['#displayName'] = 'displayName';
      expressionAttributeValues[':displayName'] = updates.displayName;
    }

    if (updates.bio !== undefined) {
      updateExpressions.push('#bio = :bio');
      expressionAttributeNames['#bio'] = 'bio';
      expressionAttributeValues[':bio'] = updates.bio;
    }

    if (updates.avatar !== undefined) {
      updateExpressions.push('#avatar = :avatar');
      expressionAttributeNames['#avatar'] = 'avatar';
      expressionAttributeValues[':avatar'] = updates.avatar;
    }

    if (updates.isPrivate !== undefined) {
      updateExpressions.push('#isPrivate = :isPrivate');
      expressionAttributeNames['#isPrivate'] = 'isPrivate';
      expressionAttributeValues[':isPrivate'] = updates.isPrivate;
    }

    // Always update the updatedAt timestamp and increment version
    updateExpressions.push('#updatedAt = :updatedAt', '#version = #version + :inc');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeNames['#version'] = 'version';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    expressionAttributeValues[':inc'] = 1;

    // Update the profile
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(PK)', // Ensure profile exists
    }));

    // Publish event to EventBridge
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        Source: 'social-media.profile',
        DetailType: 'Profile Updated',
        Detail: JSON.stringify({
          userId,
          changes: updates,
          previousValues: {
            displayName: currentProfile.Item.displayName,
            bio: currentProfile.Item.bio,
            avatar: currentProfile.Item.avatar,
            isPrivate: currentProfile.Item.isPrivate,
          },
          timestamp: expressionAttributeValues[':updatedAt'],
        }),
        EventBusName: process.env.EVENT_BUS_NAME!,
      }],
    }));

    // Return updated profile (without internal fields)
    const updatedProfile = updateResult.Attributes;
    const responseProfile = {
      userId: updatedProfile!.userId,
      username: updatedProfile!.username,
      displayName: updatedProfile!.displayName,
      bio: updatedProfile!.bio,
      avatar: updatedProfile!.avatar,
      followersCount: updatedProfile!.followersCount,
      followingCount: updatedProfile!.followingCount,
      postsCount: updatedProfile!.postsCount,
      isVerified: updatedProfile!.isVerified,
      isPrivate: updatedProfile!.isPrivate,
      createdAt: updatedProfile!.createdAt,
      updatedAt: updatedProfile!.updatedAt,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
      },
      body: JSON.stringify(responseProfile),
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        body: JSON.stringify({ error: 'Profile not found' }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
