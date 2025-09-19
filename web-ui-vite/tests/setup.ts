/**
 * Vitest test setup configuration
 *
 * Global test setup for all Vitest tests in the project.
 * Configures testing library and global test utilities.
 */

import '@testing-library/jest-dom';

// Mock environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'https://test-api.example.com',
    VITE_NODE_ENV: 'test',
    MODE: 'test',
  },
  writable: true,
});

// Global test utilities
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;