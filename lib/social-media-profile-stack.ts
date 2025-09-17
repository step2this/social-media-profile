import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RUNTIME_CONFIG, BUNDLING_CONFIG } from './constants/runtime-config';

export class ProfileServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for User Profiles
    const profileTable = new dynamodb.Table(this, 'ProfileTable', {
      tableName: 'user-profiles',
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
    profileTable.addGlobalSecondaryIndex({
      indexName: 'username-index',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // EventBridge Custom Bus
    const socialMediaEventBus = new events.EventBus(this, 'SocialMediaEventBus', {
      eventBusName: 'social-media-events',
    });

    // S3 Bucket for Image Storage
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `social-media-images-${cdk.Stack.of(this).account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'], // In production, restrict this to your domain
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-multipart-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // Profile CRUD Lambda Functions
    const createProfileFunction = new lambda.Function(this, 'CreateProfileFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'create.handler',
      code: lambda.Code.fromAsset('lambda/profile-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'CreateProfileLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Social Features Lambda Functions
    const followUserFunction = new lambda.Function(this, 'FollowUserFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'follow.handler',
      code: lambda.Code.fromAsset('lambda/social-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'FollowUserLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const unfollowUserFunction = new lambda.Function(this, 'UnfollowUserFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'unfollow.handler',
      code: lambda.Code.fromAsset('lambda/social-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'UnfollowUserLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const checkFollowFunction = new lambda.Function(this, 'CheckFollowFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'check-follow.handler',
      code: lambda.Code.fromAsset('lambda/social-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'CheckFollowLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const getFollowersFunction = new lambda.Function(this, 'GetFollowersFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'get-followers.handler',
      code: lambda.Code.fromAsset('lambda/social-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'GetFollowersLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Posts Lambda Functions
    const createPostFunction = new lambda.Function(this, 'CreatePostFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'create.handler',
      code: lambda.Code.fromAsset('lambda/posts-esm'),
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

    const getUserPostsFunction = new lambda.Function(this, 'GetUserPostsFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'get-user-posts.handler',
      code: lambda.Code.fromAsset('lambda/posts-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'GetUserPostsLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const getFeedFunction = new lambda.Function(this, 'GetFeedFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'get-feed.handler',
      code: lambda.Code.fromAsset('lambda/feed-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'GetFeedLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const createFeedItemsFunction = new lambda.Function(this, 'CreateFeedItemsFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'create-feed-items.handler',
      code: lambda.Code.fromAsset('lambda/feed-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'CreateFeedItemsLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });


    // Image Upload Lambda Function
    const imageUploadFunction = new lambda.Function(this, 'ImageUploadFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'upload-url.handler',
      code: lambda.Code.fromAsset('lambda/images-esm'),
      environment: {
        IMAGES_BUCKET_NAME: imagesBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'ImageUploadLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Like/Unlike Lambda Functions
    const likePostFunction = new lambda.Function(this, 'LikePostFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'like-post.handler',
      code: lambda.Code.fromAsset('lambda/likes-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'LikePostLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const unlikePostFunction = new lambda.Function(this, 'UnlikePostFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'unlike-post.handler',
      code: lambda.Code.fromAsset('lambda/likes-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'UnlikePostLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const checkLikeStatusFunction = new lambda.Function(this, 'CheckLikeStatusFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'check-like-status.handler',
      code: lambda.Code.fromAsset('lambda/likes-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'CheckLikeStatusLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Admin Lambda Functions
    const listUsersFunction = new lambda.Function(this, 'ListUsersFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'list-users.handler',
      code: lambda.Code.fromAsset('lambda/admin-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'ListUsersLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const deleteUserFunction = new lambda.Function(this, 'DeleteUserFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'delete-user.handler',
      code: lambda.Code.fromAsset('lambda/admin-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(60),
      logGroup: new logs.LogGroup(this, 'DeleteUserLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const cleanupAllFunction = new lambda.Function(this, 'CleanupAllFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'cleanup-all.handler',
      code: lambda.Code.fromAsset('lambda/admin-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        S3_BUCKET: imagesBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
      logGroup: new logs.LogGroup(this, 'CleanupAllLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const generateTestDataFunction = new lambda.Function(this, 'GenerateTestDataFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'generate-test-data.handler',
      code: lambda.Code.fromAsset('lambda/admin-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        API_BASE_URL: 'https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod',
      },
      timeout: cdk.Duration.minutes(5),
      logGroup: new logs.LogGroup(this, 'GenerateTestDataLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const getEventsFunction = new lambda.Function(this, 'GetEventsFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'get-events.handler',
      code: lambda.Code.fromAsset('lambda/admin-esm'),
      environment: {
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'GetEventsLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Data Service Lambda Functions - Using ES Modules
    const postsDataServiceFunction = new lambda.Function(this, 'PostsDataServiceFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'posts-data-service.handler',
      code: lambda.Code.fromAsset('lambda/data'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'PostsDataServiceLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const getProfileFunction = new lambda.Function(this, 'GetProfileFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'get.handler',
      code: lambda.Code.fromAsset('lambda/profile-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'GetProfileLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    const updateProfileFunction = new lambda.Function(this, 'UpdateProfileFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'update.handler',
      code: lambda.Code.fromAsset('lambda/profile-esm'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: socialMediaEventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'UpdateProfileLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Event Processing Lambda - handles profile events
    const profileEventProcessor = new NodejsFunction(this, 'ProfileEventProcessor', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'handler',
      entry: 'lambda/events/profile-processor.ts',
      bundling: BUNDLING_CONFIG,
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'ProfileEventProcessorLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Grant DynamoDB permissions
    profileTable.grantReadWriteData(createProfileFunction);
    profileTable.grantReadData(getProfileFunction);
    profileTable.grantReadWriteData(updateProfileFunction);
    profileTable.grantReadData(profileEventProcessor);
    profileTable.grantReadWriteData(followUserFunction);
    profileTable.grantReadWriteData(unfollowUserFunction);
    profileTable.grantReadData(checkFollowFunction);
    profileTable.grantReadData(getFollowersFunction);
    profileTable.grantReadWriteData(createPostFunction);
    profileTable.grantReadData(getUserPostsFunction);
    profileTable.grantReadData(getFeedFunction);
    profileTable.grantWriteData(createFeedItemsFunction);
    profileTable.grantReadWriteData(likePostFunction);
    profileTable.grantReadWriteData(unlikePostFunction);
    profileTable.grantReadData(checkLikeStatusFunction);

    // Grant admin function permissions
    profileTable.grantReadData(listUsersFunction);
    profileTable.grantReadWriteData(deleteUserFunction);
    profileTable.grantReadWriteData(cleanupAllFunction);
    profileTable.grantReadWriteData(generateTestDataFunction);
    profileTable.grantReadWriteData(postsDataServiceFunction);

    // Get events function doesn't need special permissions for demo (generates sample data)

    // Grant S3 permissions
    imagesBucket.grantWrite(imageUploadFunction);
    imagesBucket.grantPutAcl(imageUploadFunction);
    imagesBucket.grantReadWrite(cleanupAllFunction);

    // Grant EventBridge permissions
    socialMediaEventBus.grantPutEventsTo(createProfileFunction);
    socialMediaEventBus.grantPutEventsTo(updateProfileFunction);
    socialMediaEventBus.grantPutEventsTo(followUserFunction);
    socialMediaEventBus.grantPutEventsTo(unfollowUserFunction);
    socialMediaEventBus.grantPutEventsTo(createPostFunction);
    socialMediaEventBus.grantPutEventsTo(likePostFunction);
    socialMediaEventBus.grantPutEventsTo(unlikePostFunction);

    // EventBridge Rules
    new events.Rule(this, 'ProfileCreatedRule', {
      eventBus: socialMediaEventBus,
      ruleName: 'profile-created-rule',
      eventPattern: {
        source: ['social-media.profile'],
        detailType: ['Profile Created'],
      },
      targets: [new targets.LambdaFunction(profileEventProcessor)],
    });

    new events.Rule(this, 'ProfileUpdatedRule', {
      eventBus: socialMediaEventBus,
      ruleName: 'profile-updated-rule',
      eventPattern: {
        source: ['social-media.profile'],
        detailType: ['Profile Updated'],
      },
      targets: [new targets.LambdaFunction(profileEventProcessor)],
    });


    // Like Events Rules (for potential notifications or analytics)
    new events.Rule(this, 'PostLikedRule', {
      eventBus: socialMediaEventBus,
      ruleName: 'post-liked-rule',
      eventPattern: {
        source: ['social-media.likes'],
        detailType: ['Post Liked'],
      },
      targets: [new targets.LambdaFunction(profileEventProcessor)],
    });

    new events.Rule(this, 'PostUnlikedRule', {
      eventBus: socialMediaEventBus,
      ruleName: 'post-unliked-rule',
      eventPattern: {
        source: ['social-media.likes'],
        detailType: ['Post Unliked'],
      },
      targets: [new targets.LambdaFunction(profileEventProcessor)],
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ProfileApi', {
      restApiName: 'Social Media Profile Service',
      description: 'API for user profile management',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Feed Processor (defined after API for URL access)
    const feedProcessor = new NodejsFunction(this, 'FeedProcessor', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'handler',
      entry: 'lambda/events/feed-processor.ts',
      bundling: BUNDLING_CONFIG,
      environment: {
        API_BASE_URL: api.url.replace(/\/$/, ''),
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: new logs.LogGroup(this, 'FeedProcessorLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // EventBridge Rules for Feed Processor
    new events.Rule(this, 'PostCreatedRule', {
      eventBus: socialMediaEventBus,
      ruleName: 'post-created-rule',
      eventPattern: {
        source: ['social-media.posts'],
        detailType: ['Post Created'],
      },
      targets: [new targets.LambdaFunction(feedProcessor)],
    });

    // API Resources
    const profilesResource = api.root.addResource('profiles');
    const profileResource = profilesResource.addResource('{userId}');

    // Social API Resources
    const socialResource = api.root.addResource('social');
    const followResource = socialResource.addResource('follow');
    const unfollowResource = socialResource.addResource('unfollow');
    const checkFollowResource = socialResource.addResource('check-follow');
    const checkFollowDetailResource = checkFollowResource.addResource('{followerId}').addResource('{followedUserId}');
    const followersResource = socialResource.addResource('followers').addResource('{userId}');

    // Posts API Resources
    const postsResource = api.root.addResource('posts');
    const userPostsResource = postsResource.addResource('user').addResource('{userId}');

    // Feed API Resources
    const feedResource = api.root.addResource('feed');
    const userFeedResource = feedResource.addResource('{userId}');
    const feedItemsResource = feedResource.addResource('items');

    // Images API Resources
    const imagesResource = api.root.addResource('images');
    const uploadUrlResource = imagesResource.addResource('upload-url');

    // Likes API Resources
    const likesResource = api.root.addResource('likes');
    const likeResource = likesResource.addResource('like');
    const unlikeResource = likesResource.addResource('unlike');
    const checkLikeResource = likesResource.addResource('check');
    const checkLikeDetailResource = checkLikeResource.addResource('{userId}').addResource('{postId}');

    // Admin API Resources
    const adminResource = api.root.addResource('admin');
    const adminUsersResource = adminResource.addResource('users');
    const adminUserResource = adminUsersResource.addResource('{userId}');
    const adminCleanupResource = adminResource.addResource('cleanup');
    const adminTestDataResource = adminResource.addResource('test-data');
    const adminEventsResource = adminResource.addResource('events');

    // Data API Resources
    const dataResource = api.root.addResource('data');
    const dataPostsResource = dataResource.addResource('posts');
    const dataPostsActionResource = dataPostsResource.addResource('{action}');

    // API Methods
    profilesResource.addMethod('POST', new apigateway.LambdaIntegration(createProfileFunction), {
      requestValidator: new apigateway.RequestValidator(this, 'CreateProfileValidator', {
        restApi: api,
        requestValidatorName: 'create-profile-validator',
        validateRequestBody: true,
      }),
    });

    profileResource.addMethod('GET', new apigateway.LambdaIntegration(getProfileFunction));
    profileResource.addMethod('PUT', new apigateway.LambdaIntegration(updateProfileFunction));

    // Social API Methods
    followResource.addMethod('POST', new apigateway.LambdaIntegration(followUserFunction));
    unfollowResource.addMethod('POST', new apigateway.LambdaIntegration(unfollowUserFunction));
    checkFollowDetailResource.addMethod('GET', new apigateway.LambdaIntegration(checkFollowFunction));
    followersResource.addMethod('GET', new apigateway.LambdaIntegration(getFollowersFunction));

    // Posts API Methods
    postsResource.addMethod('POST', new apigateway.LambdaIntegration(createPostFunction));
    userPostsResource.addMethod('GET', new apigateway.LambdaIntegration(getUserPostsFunction));

    // Feed API Methods
    userFeedResource.addMethod('GET', new apigateway.LambdaIntegration(getFeedFunction));
    feedItemsResource.addMethod('POST', new apigateway.LambdaIntegration(createFeedItemsFunction));

    // Images API Methods
    uploadUrlResource.addMethod('POST', new apigateway.LambdaIntegration(imageUploadFunction));

    // Likes API Methods
    likeResource.addMethod('POST', new apigateway.LambdaIntegration(likePostFunction));
    unlikeResource.addMethod('POST', new apigateway.LambdaIntegration(unlikePostFunction));
    checkLikeDetailResource.addMethod('GET', new apigateway.LambdaIntegration(checkLikeStatusFunction));

    // Admin API Methods
    adminUsersResource.addMethod('GET', new apigateway.LambdaIntegration(listUsersFunction));
    adminUserResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserFunction));
    adminCleanupResource.addMethod('POST', new apigateway.LambdaIntegration(cleanupAllFunction));
    adminTestDataResource.addMethod('POST', new apigateway.LambdaIntegration(generateTestDataFunction));
    adminEventsResource.addMethod('GET', new apigateway.LambdaIntegration(getEventsFunction));
    dataPostsActionResource.addMethod('POST', new apigateway.LambdaIntegration(postsDataServiceFunction));
    dataPostsActionResource.addMethod('GET', new apigateway.LambdaIntegration(postsDataServiceFunction));

    // S3 Bucket for React App
    const webAppBucket = new s3.Bucket(this, 'WebAppBucket', {
      bucketName: `social-media-profile-web-${cdk.Stack.of(this).account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'WebAppOAI', {
      comment: 'Origin Access Identity for Social Media Profile Web App',
    });

    // Grant CloudFront access to S3 bucket
    webAppBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'WebAppDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(webAppBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // For SPA routing
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      comment: 'Social Media Profile Web App',
    });

    // Deploy React App
    new s3deploy.BucketDeployment(this, 'WebAppDeployment', {
      sources: [s3deploy.Source.asset('./web-ui/build')],
      destinationBucket: webAppBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: socialMediaEventBus.eventBusArn,
      description: 'EventBridge Bus ARN',
    });

    new cdk.CfnOutput(this, 'ProfileTableName', {
      value: profileTable.tableName,
      description: 'DynamoDB Profile Table Name',
    });

    new cdk.CfnOutput(this, 'WebAppUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Web Application URL',
    });

    new cdk.CfnOutput(this, 'WebAppBucketName', {
      value: webAppBucket.bucketName,
      description: 'S3 Bucket for Web App',
    });

    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
      description: 'S3 Bucket for Images',
    });
  }
}
