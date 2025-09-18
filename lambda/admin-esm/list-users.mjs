import { ProfileData, createSuccessResponse, createErrorResponse, createValidationError, handleOptionsRequest } from '../shared/index.mjs';

// Pre-warm the connections with top-level await
await Promise.resolve();

export const handler = async (event) => {
  try {
    if (handleOptionsRequest(event)) {
      return handleOptionsRequest(event);
    }

    const { page = '1', limit = '10' } = event.queryStringParameters || {};
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);

    if (isNaN(pageNumber) || isNaN(pageLimit) || pageNumber < 1 || pageLimit < 1 || pageLimit > 100) {
      return createValidationError('Invalid pagination parameters');
    }

    // Get all users through ProfileData
    const users = await ProfileData.getAllProfiles();

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate pagination
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / pageLimit);
    const startIndex = (pageNumber - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return createSuccessResponse({
      users: paginatedUsers,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers,
        pageSize: pageLimit,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });

  } catch (error) {
    console.error('Error listing users:', error);
    return createErrorResponse('Failed to list users', error);
  }
};