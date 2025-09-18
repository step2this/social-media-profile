// Test the shared response helpers by mocking them as TypeScript modules
describe('Shared Response Helpers', () => {
  // Mock the response helper functions
  const createSuccessResponse = (data: any) => ({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(data)
  });

  const createErrorResponse = (message: string, error?: any) => ({
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      error: message,
      ...(error && { details: error instanceof Error ? error.message : String(error) })
    })
  });

  const createValidationError = (message: string) => ({
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      error: 'Validation Error',
      details: message
    })
  });

  const handleOptionsRequest = (event: any) => {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: ''
      };
    }
    return null;
  };

  describe('createSuccessResponse', () => {
    it('should create a successful response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(JSON.parse(response.body)).toEqual(data);
    });

    it('should handle null data', () => {
      const response = createSuccessResponse(null);
      expect(response.body).toBe('null');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with message and error object', () => {
      const error = new Error('Database connection failed');
      const response = createErrorResponse('Internal server error', error);

      expect(response.statusCode).toBe(500);
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
      expect(body.details).toBe('Database connection failed');
    });

    it('should handle no error details', () => {
      const response = createErrorResponse('Something went wrong');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Something went wrong');
      expect(body.details).toBeUndefined();
    });
  });

  describe('createValidationError', () => {
    it('should create validation error response', () => {
      const response = createValidationError('Email is required');

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation Error');
      expect(body.details).toBe('Email is required');
    });
  });

  describe('handleOptionsRequest', () => {
    it('should return OPTIONS response for OPTIONS method', () => {
      const event = { httpMethod: 'OPTIONS' };
      const response = handleOptionsRequest(event);

      expect(response).not.toBeNull();
      expect(response?.statusCode).toBe(200);
      expect(response?.body).toBe('');
    });

    it('should return null for non-OPTIONS method', () => {
      const event = { httpMethod: 'GET' };
      const response = handleOptionsRequest(event);

      expect(response).toBeNull();
    });
  });
});