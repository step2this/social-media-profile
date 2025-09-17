import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BaseLambda } from './base-lambda';

export interface AdminFunctionsProps {
  /** DynamoDB table for data storage */
  table: dynamodb.Table;
  /** EventBridge bus for event access */
  eventBus: events.EventBus;
  /** S3 bucket for cleanup operations */
  imagesBucket: s3.Bucket;
  /** API Gateway URL for test data generation */
  apiUrl?: string;
}

/**
 * Admin Functions construct containing administrative operations
 * - List users
 * - Delete user
 * - Cleanup all data
 * - Generate test data
 * - Get events
 */
export class AdminFunctions extends Construct {
  public readonly listUsersFunction: lambda.Function;
  public readonly deleteUserFunction: lambda.Function;
  public readonly cleanupAllFunction: lambda.Function;
  public readonly generateTestDataFunction: lambda.Function;
  public readonly getEventsFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: AdminFunctionsProps) {
    super(scope, id);

    const baseEnvironment = {
      TABLE_NAME: props.table.tableName,
    };

    // List Users Function (using ES modules)
    const listUsers = new BaseLambda(this, 'ListUsers', {
      handler: 'list-users.handler',
      codeAssetPath: 'lambda/admin-esm',
      environment: baseEnvironment,
      timeout: cdk.Duration.seconds(30),
    });
    this.listUsersFunction = listUsers.function;

    // Delete User Function (using ES modules)
    const deleteUser = new BaseLambda(this, 'DeleteUser', {
      handler: 'delete-user.handler',
      codeAssetPath: 'lambda/admin-esm',
      environment: baseEnvironment,
      timeout: cdk.Duration.seconds(60),
    });
    this.deleteUserFunction = deleteUser.function;

    // Cleanup All Function (using ES modules)
    const cleanupAll = new BaseLambda(this, 'CleanupAll', {
      handler: 'cleanup-all.handler',
      codeAssetPath: 'lambda/admin-esm',
      environment: {
        ...baseEnvironment,
        S3_BUCKET: props.imagesBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
    });
    this.cleanupAllFunction = cleanupAll.function;

    // Generate Test Data Function (using ES modules)
    const generateTestData = new BaseLambda(this, 'GenerateTestData', {
      handler: 'generate-test-data.handler',
      codeAssetPath: 'lambda/admin-esm',
      environment: {
        ...baseEnvironment,
        API_BASE_URL: props.apiUrl ?? 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod',
      },
      timeout: cdk.Duration.minutes(5),
    });
    this.generateTestDataFunction = generateTestData.function;

    // Get Events Function (using ES modules)
    const getEvents = new BaseLambda(this, 'GetEvents', {
      handler: 'get-events.handler',
      codeAssetPath: 'lambda/admin-esm',
      environment: {
        EVENT_BUS_NAME: props.eventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.getEventsFunction = getEvents.function;

    // Grant DynamoDB permissions
    props.table.grantReadData(this.listUsersFunction);
    props.table.grantReadWriteData(this.deleteUserFunction);
    props.table.grantReadWriteData(this.cleanupAllFunction);
    props.table.grantReadWriteData(this.generateTestDataFunction);

    // Grant S3 permissions for cleanup
    props.imagesBucket.grantReadWrite(this.cleanupAllFunction);
  }
}