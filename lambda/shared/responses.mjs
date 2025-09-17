/**
 * Standard CORS headers for API responses
 */
export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

/**
 * Create a successful response
 */
export function createSuccessResponse(data, statusCode = 200, additionalHeaders = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
    body: JSON.stringify(data),
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(error, statusCode = 500, additionalHeaders = {}) {
  const errorBody = typeof error === 'string'
    ? { error }
    : { error: error.message || 'Unknown error', ...(error.details && { details: error.details }) };

  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
    body: JSON.stringify(errorBody),
  };
}

/**
 * Create a validation error response
 */
export function createValidationError(message) {
  return createErrorResponse(message, 400);
}

/**
 * Create a not found error response
 */
export function createNotFoundError(message = 'Resource not found') {
  return createErrorResponse(message, 404);
}

/**
 * Create a conflict error response
 */
export function createConflictError(message) {
  return createErrorResponse(message, 409);
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptionsRequest() {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: '',
  };
}