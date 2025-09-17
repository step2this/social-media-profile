import { ProfileData, createSuccessResponse, createErrorResponse, createValidationError, createNotFoundError, handleOptionsRequest } from '../shared/index.mjs';

export const handler = async (event) => {
  try {
    const { userId } = event.pathParameters || {};
    const { username } = event.queryStringParameters || {};

    if (!userId && !username) {
      return createValidationError('Either userId path parameter or username query parameter is required');
    }

    let profile;

    if (userId) {
      profile = await ProfileData.getProfileById(userId);
    } else if (username) {
      profile = await ProfileData.getProfileByUsername(username);
    }

    if (!profile) {
      return createNotFoundError('Profile not found');
    }

    const publicProfile = ProfileData.getPublicProfile(profile);

    return createSuccessResponse(publicProfile, 200, {
      'Cache-Control': 'max-age=300', // Cache for 5 minutes
    });

  } catch (error) {
    console.error('Error getting profile:', error);
    return createErrorResponse('Internal server error');
  }
};