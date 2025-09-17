import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { BaseLambda } from './base-lambda';

export interface EventProcessingFunctionsProps {
  /** DynamoDB table for data storage */
  table: dynamodb.Table;
  /** EventBridge bus for processing events */
  eventBus: events.EventBus;
  /** API Gateway URL for feed processor */
  apiUrl?: string;
}

/**
 * Event Processing Functions construct containing event-driven operations
 * - Profile event processor
 * - Feed processor
 * - EventBridge rules and targets
 */
export class EventProcessingFunctions extends Construct {
  public readonly profileEventProcessor: lambda.Function;
  public readonly feedProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props: EventProcessingFunctionsProps) {
    super(scope, id);

    // Profile Event Processor (using ES modules)
    const profileProcessor = new BaseLambda(this, 'ProfileEventProcessor', {
      handler: 'profile-processor.handler',
      codeAssetPath: 'lambda/events-esm',
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.profileEventProcessor = profileProcessor.function;

    // Feed Processor (using ES modules)
    const feedProcessorFunc = new BaseLambda(this, 'FeedProcessor', {
      handler: 'feed-processor.handler',
      codeAssetPath: 'lambda/events-esm',
      environment: {
        API_BASE_URL: props.apiUrl?.replace(/\/$/, '') ?? '',
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.feedProcessor = feedProcessorFunc.function;

    // Grant DynamoDB permissions
    props.table.grantReadData(this.profileEventProcessor);

    // EventBridge Rules for Feed Processor
    new events.Rule(this, 'PostCreatedRule', {
      eventBus: props.eventBus,
      ruleName: 'post-created-rule',
      description: 'Process post created events to generate feed items',
      eventPattern: {
        source: ['social-media.posts'],
        detailType: ['Post Created'],
      },
      targets: [new targets.LambdaFunction(this.feedProcessor)],
    });

    // EventBridge Rules for Profile Event Processor
    new events.Rule(this, 'ProfileEventsRule', {
      eventBus: props.eventBus,
      ruleName: 'profile-events-rule',
      description: 'Process profile-related events',
      eventPattern: {
        source: ['social-media.profiles'],
        detailType: ['Profile Created', 'Profile Updated'],
      },
      targets: [new targets.LambdaFunction(this.profileEventProcessor)],
    });

    new events.Rule(this, 'FollowEventsRule', {
      eventBus: props.eventBus,
      ruleName: 'follow-events-rule',
      description: 'Process follow-related events',
      eventPattern: {
        source: ['social-media.follows'],
        detailType: ['User Followed', 'User Unfollowed'],
      },
      targets: [new targets.LambdaFunction(this.profileEventProcessor)],
    });

    new events.Rule(this, 'LikeEventsRule', {
      eventBus: props.eventBus,
      ruleName: 'like-events-rule',
      description: 'Process like-related events',
      eventPattern: {
        source: ['social-media.likes'],
        detailType: ['Post Liked', 'Post Unliked'],
      },
      targets: [new targets.LambdaFunction(this.profileEventProcessor)],
    });
  }
}