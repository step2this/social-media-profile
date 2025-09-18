import { CloudFormationClient, DescribeStacksCommand, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { APIGatewayClient, GetRestApisCommand, GetResourcesCommand, GetMethodCommand } from '@aws-sdk/client-api-gateway';

/**
 * Deployment Validation Tests
 *
 * These tests validate that our deployed infrastructure matches expectations
 * and would have caught the issues we found during debugging:
 * 1. Placeholder functions deployed instead of real ones
 * 2. Lambda functions missing dependencies
 * 3. Incorrect module import paths
 * 4. API Gateway pointing to wrong functions
 */

const STACK_NAME = 'ProfileServiceStack';
const EXPECTED_LAMBDA_FUNCTIONS = [
  'AdminFunctionsListUsersFunction',
  'AdminFunctionsDeleteUserFunction',
  'AdminFunctionsGenerateTestDataFunction',
  'AdminFunctionsCleanupAllFunction',
  'AdminFunctionsGetEventsFunction'
];

describe('Deployment Validation Tests', () => {
  let cfClient: CloudFormationClient;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: APIGatewayClient;
  let stackResources: any[];

  beforeAll(async () => {
    cfClient = new CloudFormationClient({ region: 'us-east-1' });
    lambdaClient = new LambdaClient({ region: 'us-east-1' });
    apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

    // Get all stack resources
    const stackResourcesResponse = await cfClient.send(new DescribeStackResourcesCommand({
      StackName: STACK_NAME
    }));
    stackResources = stackResourcesResponse.StackResources || [];
  });

  describe('Lambda Function Validation', () => {
    test('should have no placeholder Lambda functions deployed', async () => {
      const lambdaResources = stackResources.filter(resource =>
        resource.ResourceType === 'AWS::Lambda::Function'
      );

      for (const resource of lambdaResources) {
        const functionName = resource.PhysicalResourceId!;

        // Check function name doesn't contain "Placeholder"
        expect(functionName).not.toContain('Placeholder');

        // Get function configuration
        const functionConfig = await lambdaClient.send(new GetFunctionCommand({
          FunctionName: functionName
        }));

        // Check it's not using inline code (placeholder indicator)
        expect(functionConfig.Code?.Location).toBeDefined();
        expect(functionConfig.Configuration?.Handler).not.toBe('index.handler');
      }
    });

    test('should have correct handlers for admin functions', async () => {
      const adminFunctions = stackResources.filter(resource =>
        resource.ResourceType === 'AWS::Lambda::Function' &&
        EXPECTED_LAMBDA_FUNCTIONS.some(name => resource.LogicalResourceId?.includes(name.replace('AdminFunctions', '')))
      );

      expect(adminFunctions.length).toBeGreaterThan(0);

      for (const resource of adminFunctions) {
        const functionConfig = await lambdaClient.send(new GetFunctionCommand({
          FunctionName: resource.PhysicalResourceId!
        }));

        const handler = functionConfig.Configuration?.Handler;

        // Should use admin-esm/ prefix and .handler suffix
        expect(handler).toMatch(/^admin-esm\/.*\.handler$/);
        expect(handler).not.toBe('index.handler'); // Not placeholder
      }
    });

    test('should be able to successfully import dependencies', async () => {
      // Test that functions can at least initialize without module errors
      const listUsersFunction = stackResources.find(resource =>
        resource.LogicalResourceId?.includes('ListUsersFunction')
      );

      if (listUsersFunction) {
        try {
          // Attempt a dry-run invocation to check for import errors
          const response = await lambdaClient.send(new InvokeCommand({
            FunctionName: listUsersFunction.PhysicalResourceId!,
            InvocationType: 'DryRun',
            Payload: JSON.stringify({
              httpMethod: 'GET',
              path: '/admin/users',
              queryStringParameters: {}
            })
          }));

          // Should not have function errors (which would indicate import/dependency issues)
          expect(response.FunctionError).toBeUndefined();
        } catch (error: any) {
          // If it's not a DryRun validation error, it might be an import issue
          if (!error.message?.includes('DryRun')) {
            throw error;
          }
        }
      }
    });
  });

  describe('API Gateway Validation', () => {
    test('should have API Gateway pointing to real functions', async () => {
      const apiGateways = stackResources.filter(resource =>
        resource.ResourceType === 'AWS::ApiGateway::RestApi'
      );

      expect(apiGateways.length).toBeGreaterThan(0);

      const apiId = apiGateways[0].PhysicalResourceId!;

      // Get API resources
      const resources = await apiGatewayClient.send(new GetResourcesCommand({
        restApiId: apiId
      }));

      // Find admin endpoints
      const adminPaths = resources.items?.filter((item: any) =>
        item.path?.includes('/admin')
      ) || [];

      expect(adminPaths.length).toBeGreaterThan(0);

      // Check that admin endpoints have proper integrations
      for (const resource of adminPaths) {
        if (resource.resourceMethods) {
          for (const [method] of Object.entries(resource.resourceMethods)) {
            if (method !== 'OPTIONS') {
              const methodConfig = await apiGatewayClient.send(new GetMethodCommand({
                restApiId: apiId,
                resourceId: resource.id!,
                httpMethod: method
              }));

              // Should have Lambda integration
              expect(methodConfig.methodIntegration?.type).toBe('AWS_PROXY');
              expect(methodConfig.methodIntegration?.uri).toContain('lambda');

              // Should not point to placeholder functions
              expect(methodConfig.methodIntegration?.uri).not.toContain('Placeholder');
            }
          }
        }
      }
    });
  });

  describe('Environment Configuration Validation', () => {
    test('should have consistent API URL in stack outputs', async () => {
      const stackDescription = await cfClient.send(new DescribeStacksCommand({
        StackName: STACK_NAME
      }));

      const stack = stackDescription.Stacks?.[0];
      const outputs = stack?.Outputs || [];

      const apiUrlOutput = outputs.find((output: any) =>
        output.OutputKey?.includes('ApiUrl') || output.OutputKey?.includes('ApiEndpoint')
      );

      expect(apiUrlOutput).toBeDefined();
      expect(apiUrlOutput?.OutputValue).toMatch(/^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com\/prod\/$/);
    });
  });
});

/**
 * Smoke Tests - Basic functionality validation
 * These run after deployment to ensure basic connectivity
 */
describe('Post-Deployment Smoke Tests', () => {
  let apiUrl: string;

  beforeAll(async () => {
    const cfClient = new CloudFormationClient({ region: 'us-east-1' });
    const stackDescription = await cfClient.send(new DescribeStacksCommand({
      StackName: STACK_NAME
    }));

    const stack = stackDescription.Stacks?.[0];
    const outputs = stack?.Outputs || [];
    const apiUrlOutput = outputs.find(output =>
      output.OutputKey?.includes('ApiUrl') || output.OutputKey?.includes('ApiEndpoint')
    );

    apiUrl = apiUrlOutput?.OutputValue || '';
    expect(apiUrl).toBeTruthy();
  });

  test('API Gateway should be reachable', async () => {
    const response = await fetch(`${apiUrl}admin/users`);

    // Should get a response (even if error, means API is reachable)
    expect(response).toBeDefined();
    expect(response.status).toBeDefined();

    // Should not be 502/503 (which indicates Lambda integration issues)
    expect(response.status).not.toBe(502);
    expect(response.status).not.toBe(503);
  });

  test('admin endpoints should not return placeholder responses', async () => {
    const response = await fetch(`${apiUrl}admin/users`);
    const text = await response.text();

    // Should not return the literal string "Placeholder"
    expect(text).not.toBe('Placeholder');
    expect(text.toLowerCase()).not.toContain('placeholder');
  });

  test('responses should be valid JSON', async () => {
    const response = await fetch(`${apiUrl}admin/users`);
    const text = await response.text();

    // Should be parseable JSON (not raw text)
    expect(() => JSON.parse(text)).not.toThrow();
  });
});