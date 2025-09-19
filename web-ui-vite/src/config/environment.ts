/**
 * Environment configuration management
 *
 * Centralizes all environment-specific configuration values.
 * Uses Vite's import.meta.env for environment variable access.
 */

import { z } from 'zod';

/**
 * Environment configuration schema for validation
 */
const EnvironmentSchema = z.object({
  apiUrl: z.string().url({ message: 'Invalid API URL' }),
  nodeEnv: z.enum(['development', 'production', 'test']),
});

/**
 * Get validated environment configuration
 * @returns Validated environment configuration object
 */
export const getEnvironmentConfig = () => {
  const rawConfig = {
    apiUrl: import.meta.env.VITE_API_URL || 'https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod',
    nodeEnv: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development',
  };

  try {
    return EnvironmentSchema.parse(rawConfig);
  } catch (error) {
    console.error('Invalid environment configuration:', error);
    throw new Error('Environment configuration validation failed');
  }
};

/**
 * Cached environment configuration
 */
export const ENV = getEnvironmentConfig();

/**
 * Environment helper functions
 */
export const isDevelopment = () => ENV.nodeEnv === 'development';
export const isProduction = () => ENV.nodeEnv === 'production';
export const isTest = () => ENV.nodeEnv === 'test';