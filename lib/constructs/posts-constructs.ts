import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface PostsConstructProps {
  profileTable: dynamodb.Table;
  socialMediaEventBus: events.EventBus;
  imagesBucket: s3.Bucket;
  api: apigateway.RestApi;
}

export class PostsConstruct extends Construct {
  public readonly createPostFunction: NodejsFunction;
  public readonly getUserPostsFunction: NodejsFunction;
  public readonly likePostFunction: NodejsFunction;
  public readonly unlikePostFunction: NodejsFunction;
  public readonly checkLikeStatusFunction: NodejsFunction;
  public readonly postsDataServiceFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: PostsConstructProps) {
    super(scope, id);

    const { profileTable, socialMediaEventBus, imagesBucket, api } = props;

    // Posts Lambda Functions
    this.createPostFunction = new NodejsFunction(this, 'CreatePostFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lambda/posts/create.ts',
      bundling: {
        externalModules: ['aws-sdk'],
        bundleAwsSDK: false,
      },
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
        API_BASE_URL: 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod',
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'CreatePostLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    this.getUserPostsFunction = new NodejsFunction(this, 'GetUserPostsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lambda/posts/get-user-posts.ts',
      bundling: {
        externalModules: ['aws-sdk'],
        bundleAwsSDK: false,
      },
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'GetUserPostsLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    this.likePostFunction = new NodejsFunction(this, 'LikePostFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lambda/posts/like.ts',
      bundling: {
        externalModules: ['aws-sdk'],
        bundleAwsSDK: false,
      },
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'LikePostLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    this.unlikePostFunction = new NodejsFunction(this, 'UnlikePostFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lambda/posts/unlike.ts',
      bundling: {
        externalModules: ['aws-sdk'],
        bundleAwsSDK: false,
      },
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'UnlikePostLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    this.checkLikeStatusFunction = new NodejsFunction(this, 'CheckLikeStatusFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lambda/posts/check-like-status.ts',
      bundling: {
        externalModules: ['aws-sdk'],
        bundleAwsSDK: false,
      },
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'CheckLikeStatusLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Data Service Lambda Functions
    this.postsDataServiceFunction = new NodejsFunction(this, 'PostsDataServiceFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lambda/data/posts-data-service.ts',
      bundling: {
        externalModules: ['aws-sdk'],
        bundleAwsSDK: false,
      },
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'PostsDataServiceLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Grant permissions
    profileTable.grantReadWriteData(this.createPostFunction);
    profileTable.grantReadData(this.getUserPostsFunction);
    profileTable.grantReadWriteData(this.likePostFunction);
    profileTable.grantReadWriteData(this.unlikePostFunction);
    profileTable.grantReadData(this.checkLikeStatusFunction);
    profileTable.grantReadWriteData(this.postsDataServiceFunction);

    socialMediaEventBus.grantPutEventsTo(this.createPostFunction);

    // API Resources
    const postsResource = api.root.addResource('posts');
    const userPostsResource = postsResource.addResource('user').addResource('{userId}');

    // Data API Resources
    const dataResource = api.root.addResource('data');
    const dataPostsResource = dataResource.addResource('posts');
    const dataPostsActionResource = dataPostsResource.addResource('{action}');

    // Likes API Resources
    const likesResource = api.root.addResource('likes');
    const postLikesResource = likesResource.addResource('{postId}');
    const userLikesResource = postLikesResource.addResource('{userId}');

    // API Methods
    postsResource.addMethod('POST', new apigateway.LambdaIntegration(this.createPostFunction));
    userPostsResource.addMethod('GET', new apigateway.LambdaIntegration(this.getUserPostsFunction));

    dataPostsActionResource.addMethod('POST', new apigateway.LambdaIntegration(this.postsDataServiceFunction));
    dataPostsActionResource.addMethod('GET', new apigateway.LambdaIntegration(this.postsDataServiceFunction));

    postLikesResource.addMethod('POST', new apigateway.LambdaIntegration(this.likePostFunction));
    userLikesResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.unlikePostFunction));
    userLikesResource.addMethod('GET', new apigateway.LambdaIntegration(this.checkLikeStatusFunction));
  }
}