import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { BaseLambda } from './base-lambda';

export interface SocialFunctionsProps {
  /** DynamoDB table for data storage */
  table: dynamodb.Table;
  /** EventBridge bus for publishing events */
  eventBus: events.EventBus;
}

/**
 * Social Functions construct containing social interaction operations
 * - Like/unlike posts
 * - Check like status
 * - Get user feed
 * - Create feed items
 */
export class SocialFunctions extends Construct {
  public readonly likePostFunction: lambda.Function;
  public readonly unlikePostFunction: lambda.Function;
  public readonly checkLikeStatusFunction: lambda.Function;
  public readonly getFeedFunction: lambda.Function;
  public readonly createFeedItemsFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: SocialFunctionsProps) {
    super(scope, id);

    const environment = {
      TABLE_NAME: props.table.tableName,
      EVENT_BUS_NAME: props.eventBus.eventBusName,
    };

    // Like Post Function
    const likePost = new BaseLambda(this, 'LikePost', {
      handler: 'like-post.handler',
      codeAssetPath: 'lambda/likes-esm',
      environment,
      timeout: cdk.Duration.seconds(30),
    });
    this.likePostFunction = likePost.function;

    // Unlike Post Function
    const unlikePost = new BaseLambda(this, 'UnlikePost', {
      handler: 'unlike-post.handler',
      codeAssetPath: 'lambda/likes-esm',
      environment,
      timeout: cdk.Duration.seconds(30),
    });
    this.unlikePostFunction = unlikePost.function;

    // Check Like Status Function
    const checkLikeStatus = new BaseLambda(this, 'CheckLikeStatus', {
      handler: 'check-like-status.handler',
      codeAssetPath: 'lambda/likes-esm',
      environment: { TABLE_NAME: props.table.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    this.checkLikeStatusFunction = checkLikeStatus.function;

    // Get Feed Function
    const getFeed = new BaseLambda(this, 'GetFeed', {
      handler: 'get-feed.handler',
      codeAssetPath: 'lambda/feed-esm',
      environment: { TABLE_NAME: props.table.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    this.getFeedFunction = getFeed.function;

    // Create Feed Items Function
    const createFeedItems = new BaseLambda(this, 'CreateFeedItems', {
      handler: 'create-feed-items.handler',
      codeAssetPath: 'lambda/feed-esm',
      environment: { TABLE_NAME: props.table.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    this.createFeedItemsFunction = createFeedItems.function;

    // Grant DynamoDB permissions
    props.table.grantReadWriteData(this.likePostFunction);
    props.table.grantReadWriteData(this.unlikePostFunction);
    props.table.grantReadData(this.checkLikeStatusFunction);
    props.table.grantReadData(this.getFeedFunction);
    props.table.grantReadWriteData(this.createFeedItemsFunction);

    // Grant EventBridge permissions
    props.eventBus.grantPutEventsTo(this.likePostFunction);
    props.eventBus.grantPutEventsTo(this.unlikePostFunction);
  }
}