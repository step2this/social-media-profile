import { AdminData, createSuccessResponse, createErrorResponse, createNotFoundError, createValidationError, handleOptionsRequest } from '../shared/index.mjs';

// Pre-warm the connections with top-level await
await Promise.resolve();

export const handler = async (event) => {
  try {
    if (handleOptionsRequest(event)) {
      return handleOptionsRequest(event);
    }

    const { userId } = event.pathParameters || {};

    if (!userId) {
      return createValidationError('userId path parameter is required');
    }

    try {
      const result = await AdminData.deleteUser(userId);

      return createSuccessResponse({
        message: 'User deleted successfully',
        ...result,
      });

    } catch (error) {
      if (error.message === 'User not found') {
        return createNotFoundError('User not found');
      }
      throw error;
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Failed to delete user', error);
  }
};