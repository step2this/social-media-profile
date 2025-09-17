import * as lambda from 'aws-cdk-lib/aws-lambda';

export const RUNTIME_CONFIG = {
  NODE_VERSION: '22',
  LAMBDA_RUNTIME: lambda.Runtime.NODEJS_22_X,
  BUNDLING_TARGET: 'node22',
  TYPESCRIPT_VERSION: '~5.3.3',
  TYPESCRIPT_TARGET: 'ES2022',
  TYPESCRIPT_LIB: ['ES2022'],
} as const;

export const BUNDLING_CONFIG = {
  externalModules: [],
  bundleAwsSDK: true,
  target: RUNTIME_CONFIG.BUNDLING_TARGET,
  minify: true,
  sourceMap: false,
  define: {
    'process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED': '1',
  },
};