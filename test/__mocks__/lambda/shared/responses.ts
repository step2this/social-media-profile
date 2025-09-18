// Mock implementation of response helpers for testing

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export function createSuccessResponse(data: any, statusCode: number = 200) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  };
}

export function createErrorResponse(message: string, error?: any, statusCode: number = 500) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      message,
      error: error?.message || error
    })
  };
}

export function createValidationError(message: string) {
  return createErrorResponse(message, null, 400);
}

export function createNotFoundError(message: string) {
  return createErrorResponse(message, null, 404);
}

export function createConflictError(message: string) {
  return createErrorResponse(message, null, 409);
}

export function handleOptionsRequest(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }
  return null;
}