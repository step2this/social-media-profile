/**
 * API Smoke Tests
 *
 * Fast, lightweight tests that verify basic API connectivity and health.
 * These run after deployment to catch fundamental integration issues.
 * Should complete in under 30 seconds and catch 80% of deployment problems.
 */

describe('API Smoke Tests', () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod/';

  describe('Basic Connectivity', () => {
    test('API Gateway should be reachable', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`, {
        method: 'GET'
      });

      // Should get a response (even if error, means API is reachable)
      expect(response).toBeDefined();
      expect(response.status).toBeDefined();

      // Should not be 502/503 (which indicates Lambda integration issues)
      expect(response.status).not.toBe(502);
      expect(response.status).not.toBe(503);
    }, 10000);

    test('CORS headers should be present', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);

      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
      expect(response.headers.get('access-control-allow-methods')).toBeDefined();
      expect(response.headers.get('access-control-allow-headers')).toBeDefined();
    });

    test('Content-Type should be application/json', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Endpoint Health', () => {
    test('GET /admin/users should not return placeholder', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const text = await response.text();

      // Should not return the literal string "Placeholder"
      expect(text).not.toBe('Placeholder');
      expect(text.toLowerCase()).not.toContain('placeholder');
    });

    test('GET /admin/users should return valid JSON', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users`);
      const text = await response.text();

      // Should be parseable JSON (not raw text)
      expect(() => JSON.parse(text)).not.toThrow();
    });

    test('POST /admin/test-data should be callable', async () => {
      const response = await fetch(`${API_BASE_URL}admin/test-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCount: 1,
          postsPerUser: 1
        })
      });

      // Should not be 502/503 (Lambda integration issues)
      expect(response.status).not.toBe(502);
      expect(response.status).not.toBe(503);

      const text = await response.text();
      expect(text).not.toBe('Placeholder');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid endpoints gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}admin/nonexistent`);

      // Should return proper error (404, 400, etc) not 502/503
      expect([400, 403, 404, 405]).toContain(response.status);
    });

    test('should handle malformed requests gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}admin/users?page=invalid`);

      // Should return an error response, not crash
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('Performance Baselines', () => {
    test('API response should be reasonably fast', async () => {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE_URL}admin/users`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 5 seconds (cold start allowance)
      expect(responseTime).toBeLessThan(5000);

      // Log response time for monitoring
      console.log(`API response time: ${responseTime}ms`);
    });
  });
});