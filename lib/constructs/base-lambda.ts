import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { RUNTIME_CONFIG } from '../constants/runtime-config';

export interface BaseLambdaProps {
  /** Handler method name (e.g., 'create.handler') */
  handler: string;
  /** Path to the ES modules code directory */
  codeAssetPath: string;
  /** Environment variables for the function */
  environment?: Record<string, string>;
  /** Function timeout, defaults to 30 seconds */
  timeout?: cdk.Duration;
  /** Log retention period, defaults to one week */
  logRetention?: logs.RetentionDays;
  /** Memory size in MB, defaults to 128 */
  memorySize?: number;
}

/**
 * Base Lambda function construct with common configuration
 * Provides consistent setup for ES module Lambda functions
 */
export class BaseLambda extends Construct {
  /** The Lambda function */
  public readonly function: lambda.Function;

  /** The CloudWatch log group */
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: BaseLambdaProps) {
    super(scope, id);

    // Create log group with configurable retention
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: props.logRetention ?? logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create ES module Lambda function
    this.function = new lambda.Function(this, 'Function', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codeAssetPath),
      environment: props.environment ?? {},
      timeout: props.timeout ?? cdk.Duration.seconds(30),
      memorySize: props.memorySize ?? 128,
      logGroup: this.logGroup,
    });
  }
}