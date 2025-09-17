import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { BaseLambda } from './base-lambda';

export interface PostsFunctionsProps {
  /** DynamoDB table for data storage */
  table: dynamodb.Table;
  /** EventBridge bus for publishing events */
  eventBus: events.EventBus;
}

/**
 * Posts Functions construct containing post operations
 * - Create post
 * - Get user posts
 */
export class PostsFunctions extends Construct {
  public readonly createPostFunction: lambda.Function;
  public readonly getUserPostsFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: PostsFunctionsProps) {
    super(scope, id);

    const environment = {
      TABLE_NAME: props.table.tableName,
      EVENT_BUS_NAME: props.eventBus.eventBusName,
    };

    // Create Post Function (using ES modules)
    const createPost = new BaseLambda(this, 'CreatePost', {
      handler: 'create.handler',
      codeAssetPath: 'lambda/posts-esm',
      environment,
      timeout: cdk.Duration.seconds(30),
    });
    this.createPostFunction = createPost.function;

    // Get User Posts Function (using ES modules)
    const getUserPosts = new BaseLambda(this, 'GetUserPosts', {
      handler: 'get-user-posts.handler',
      codeAssetPath: 'lambda/posts-esm',
      environment: { TABLE_NAME: props.table.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    this.getUserPostsFunction = getUserPosts.function;

    // Grant DynamoDB permissions
    props.table.grantReadWriteData(this.createPostFunction);
    props.table.grantReadData(this.getUserPostsFunction);

    // Grant EventBridge permissions
    props.eventBus.grantPutEventsTo(this.createPostFunction);
  }
}