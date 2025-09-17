import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RUNTIME_CONFIG, BUNDLING_CONFIG } from '../constants/runtime-config';

export interface BaseLambdaProps {
  /** Handler method name (e.g., 'create.handler') */
  handler: string;
  /** Path to the code directory (ES modules or TypeScript) */
  codeAssetPath: string;
  /** Environment variables for the function */
  environment?: Record<string, string>;
  /** Function timeout, defaults to 30 seconds */
  timeout?: cdk.Duration;
  /** Log retention period, defaults to one week */
  logRetention?: logs.RetentionDays;
  /** Memory size in MB, defaults to 128 */
  memorySize?: number;
  /** Whether to use ES modules (fromAsset) or TypeScript entry (NodejsFunction) */
  useESModules?: boolean;
  /** TypeScript entry file path (when useESModules is false) */
  entryPath?: string;
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

    // Create Lambda function - ES modules or TypeScript
    if (props.useESModules !== false && (props.codeAssetPath.includes('-esm') || props.useESModules === true)) {
      // Use ES modules with fromAsset
      this.function = new lambda.Function(this, 'Function', {
        runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
        handler: props.handler,
        code: lambda.Code.fromAsset(props.codeAssetPath),
        environment: props.environment ?? {},
        timeout: props.timeout ?? cdk.Duration.seconds(30),
        memorySize: props.memorySize ?? 128,
        logGroup: this.logGroup,
      });
    } else {
      // Use TypeScript with NodejsFunction
      this.function = new NodejsFunction(this, 'Function', {
        runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
        handler: 'handler',
        entry: props.entryPath || `${props.codeAssetPath}/${props.handler.split('.')[0]}.ts`,
        bundling: BUNDLING_CONFIG,
        environment: props.environment ?? {},
        timeout: props.timeout ?? cdk.Duration.seconds(30),
        memorySize: props.memorySize ?? 128,
        logGroup: this.logGroup,
      });
    }
  }
}