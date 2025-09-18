import {
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  handleOptionsRequest
} from '../../lambda/shared/responses';

describe('Response Helpers', () => {
  describe('createSuccessResponse', () => {
    it('should create a successful response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response).toEqual({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify(data)
      });
    });

    it('should handle null data', () => {
      const response = createSuccessResponse(null);

      expect(response.body).toBe('null');
    });

    it('should handle empty object', () => {
      const response = createSuccessResponse({});

      expect(response.body).toBe('{}');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with message and error object', () => {
      const error = new Error('Database connection failed');
      const response = createErrorResponse('Internal server error', error);

      expect(response).toEqual({
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          error: 'Internal server error',
          details: 'Database connection failed'
        })
      });
    });

    it('should handle string error', () => {
      const response = createErrorResponse('Bad request', 'Invalid input');

      expect(response.body).toContain('"details":"Invalid input"');
    });

    it('should handle no error details', () => {
      const response = createErrorResponse('Something went wrong');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Something went wrong');
      expect(body.details).toBeUndefined();
    });

    it('should handle non-Error objects', () => {
      const response = createErrorResponse('Failed', { code: 'ECONNREFUSED' });

      expect(response.body).toContain('"details":"[object Object]"');
    });
  });

  describe('createValidationError', () => {
    it('should create validation error response', () => {
      const response = createValidationError('Email is required');

      expect(response).toEqual({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          error: 'Validation Error',
          details: 'Email is required'
        })
      });
    });
  });

  describe('createNotFoundError', () => {
    it('should create not found error response', () => {
      const response = createNotFoundError('User not found');

      expect(response).toEqual({
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          error: 'Not Found',
          details: 'User not found'
        })
      });
    });

    it('should use default message when none provided', () => {
      const response = createNotFoundError();

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.details).toBeUndefined();
    });
  });

  describe('createUnauthorizedError', () => {
    it('should create unauthorized error response', () => {
      const response = createUnauthorizedError('Invalid token');

      expect(response).toEqual({
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          details: 'Invalid token'
        })
      });
    });
  });

  describe('handleOptionsRequest', () => {
    it('should return OPTIONS response for OPTIONS method', () => {
      const event = { httpMethod: 'OPTIONS' };
      const response = handleOptionsRequest(event);

      expect(response).toEqual({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: ''
      });
    });

    it('should return null for non-OPTIONS method', () => {
      const event = { httpMethod: 'GET' };
      const response = handleOptionsRequest(event);

      expect(response).toBeNull();
    });

    it('should return null for missing httpMethod', () => {
      const event = {};
      const response = handleOptionsRequest(event);

      expect(response).toBeNull();
    });
  });
});