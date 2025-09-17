import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface DataLayerProps {
  /** Custom table name, defaults to 'user-profiles' */
  tableName?: string;
  /** Custom event bus name, defaults to 'social-media-events' */
  eventBusName?: string;
  /** Custom S3 bucket name suffix */
  bucketNameSuffix?: string;
}

/**
 * Data Layer construct containing shared data resources
 * - DynamoDB table for all application data
 * - EventBridge custom bus for event processing
 * - S3 bucket for image storage
 */
export class DataLayer extends Construct {
  /** DynamoDB table for storing user profiles, posts, likes, feeds, etc. */
  public readonly table: dynamodb.Table;

  /** EventBridge custom event bus for application events */
  public readonly eventBus: events.EventBus;

  /** S3 bucket for storing uploaded images */
  public readonly imagesBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataLayerProps = {}) {
    super(scope, id);

    // DynamoDB Table for all application data using single-table design
    this.table = new dynamodb.Table(this, 'Table', {
      tableName: props.tableName ?? 'user-profiles',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Global Secondary Index for username lookups
    this.table.addGlobalSecondaryIndex({
      indexName: 'username-index',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // EventBridge Custom Bus for application events
    this.eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: props.eventBusName ?? 'social-media-events',
    });

    // S3 Bucket for Image Storage
    this.imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `social-media-images-${props.bucketNameSuffix ?? cdk.Stack.of(this).account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // Configure for production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // CloudFormation outputs for cross-stack references
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB table ARN',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'EventBridge custom bus name',
    });

    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: this.imagesBucket.bucketName,
      description: 'S3 images bucket name',
    });
  }
}