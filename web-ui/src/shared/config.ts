export const API_CONFIG = {
  // Default timeouts and other config
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRY_COUNT: 3,

  // Common headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// Environment detection
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Enhanced environment-aware service configuration for web UI
export class ServiceConfig {
  private static readonly DEFAULT_PROD_URL = 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod';
  private static readonly DEFAULT_DEV_URL = 'http://localhost:3000';

  /**
   * Get the API base URL for web UI based on environment
   * Priority: Environment variables > Stage-based URLs > Defaults
   */
  static getApiUrl(service?: string): string {
    // 1. Check for explicit service-specific override
    if (service) {
      const serviceUrl = process.env[`REACT_APP_${service.toUpperCase()}_SERVICE_URL`];
      if (serviceUrl) return serviceUrl;
    }

    // 2. Check for general API URL override (React apps use REACT_APP_ prefix)
    const apiUrl = process.env.REACT_APP_API_URL;
    if (apiUrl) return apiUrl;

    // 3. Fallback based on NODE_ENV
    switch (process.env.NODE_ENV) {
      case 'development':
        return this.DEFAULT_DEV_URL;

      case 'production':
        return this.DEFAULT_PROD_URL;

      default:
        return this.DEFAULT_PROD_URL;
    }
  }

  /**
   * Get service-specific configuration
   */
  static getServiceConfig(serviceName: string) {
    return {
      baseUrl: this.getApiUrl(serviceName),
      timeout: parseInt(process.env[`REACT_APP_${serviceName.toUpperCase()}_TIMEOUT`] || '') || API_CONFIG.DEFAULT_TIMEOUT,
      retryCount: parseInt(process.env[`REACT_APP_${serviceName.toUpperCase()}_RETRY_COUNT`] || '') || API_CONFIG.DEFAULT_RETRY_COUNT,
    };
  }

  /**
   * Get current environment info
   */
  static getEnvironmentInfo() {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      apiUrl: this.getApiUrl(),
      isDevelopment: IS_DEVELOPMENT,
      isTest: IS_TEST,
      isProduction: IS_PRODUCTION,
    };
  }
}

// Backward compatibility
export function getApiUrl(): string {
  return ServiceConfig.getApiUrl();
}