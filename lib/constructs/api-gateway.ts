import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface ApiGatewayConstructProps {
  // Profile Functions
  createProfileFunction: lambda.Function;
  getProfileFunction: lambda.Function;
  updateProfileFunction: lambda.Function;
  followUserFunction: lambda.Function;
  unfollowUserFunction: lambda.Function;
  checkFollowFunction: lambda.Function;
  getFollowersFunction: lambda.Function;

  // Posts Functions
  createPostFunction: lambda.Function;
  getUserPostsFunction: lambda.Function;

  // Social Functions
  likePostFunction: lambda.Function;
  unlikePostFunction: lambda.Function;
  checkLikeStatusFunction: lambda.Function;
  getFeedFunction: lambda.Function;
  createFeedItemsFunction: lambda.Function;

  // Image Functions
  imageUploadFunction: lambda.Function;

  // Admin Functions
  listUsersFunction: lambda.Function;
  deleteUserFunction: lambda.Function;
  cleanupAllFunction: lambda.Function;
  generateTestDataFunction: lambda.Function;
  getEventsFunction: lambda.Function;

  // Data Service Functions (to be refactored)
  postsDataServiceFunction?: lambda.Function;
  profilesDataServiceFunction?: lambda.Function;
}

/**
 * API Gateway construct containing REST API and all routes
 * Also includes static website hosting with CloudFront
 */
export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Create REST API
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'Social Media Profile Service',
      description: 'REST API for social media profile service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Profile routes
    const profilesResource = this.api.root.addResource('profiles');
    const profileResource = profilesResource.addResource('{userId}');

    profilesResource.addMethod('POST', new apigateway.LambdaIntegration(props.createProfileFunction));
    profileResource.addMethod('GET', new apigateway.LambdaIntegration(props.getProfileFunction));
    profileResource.addMethod('PUT', new apigateway.LambdaIntegration(props.updateProfileFunction));

    // Follow routes
    const followResource = profileResource.addResource('follow');
    const unfollowResource = profileResource.addResource('unfollow');
    const checkFollowDetailResource = profileResource.addResource('following').addResource('{targetUserId}');
    const followersResource = profileResource.addResource('followers');

    followResource.addMethod('POST', new apigateway.LambdaIntegration(props.followUserFunction));
    unfollowResource.addMethod('POST', new apigateway.LambdaIntegration(props.unfollowUserFunction));
    checkFollowDetailResource.addMethod('GET', new apigateway.LambdaIntegration(props.checkFollowFunction));
    followersResource.addMethod('GET', new apigateway.LambdaIntegration(props.getFollowersFunction));

    // Posts routes
    const postsResource = this.api.root.addResource('posts');
    const userPostsResource = profileResource.addResource('posts');

    postsResource.addMethod('POST', new apigateway.LambdaIntegration(props.createPostFunction));
    userPostsResource.addMethod('GET', new apigateway.LambdaIntegration(props.getUserPostsFunction));

    // Like routes
    const likeResource = this.api.root.addResource('like');
    const unlikeResource = this.api.root.addResource('unlike');
    const checkLikeDetailResource = this.api.root.addResource('likes').addResource('{userId}').addResource('{postId}');

    likeResource.addMethod('POST', new apigateway.LambdaIntegration(props.likePostFunction));
    unlikeResource.addMethod('POST', new apigateway.LambdaIntegration(props.unlikePostFunction));
    checkLikeDetailResource.addMethod('GET', new apigateway.LambdaIntegration(props.checkLikeStatusFunction));

    // Feed routes
    const userFeedResource = profileResource.addResource('feed');
    const feedItemsResource = this.api.root.addResource('feed-items');

    userFeedResource.addMethod('GET', new apigateway.LambdaIntegration(props.getFeedFunction));
    feedItemsResource.addMethod('POST', new apigateway.LambdaIntegration(props.createFeedItemsFunction));

    // Image upload routes
    const uploadUrlResource = this.api.root.addResource('upload-url');
    uploadUrlResource.addMethod('POST', new apigateway.LambdaIntegration(props.imageUploadFunction));

    // Admin routes
    const adminResource = this.api.root.addResource('admin');
    const adminUsersResource = adminResource.addResource('users');
    const adminUserResource = adminUsersResource.addResource('{userId}');
    const adminCleanupResource = adminResource.addResource('cleanup');
    const adminTestDataResource = adminResource.addResource('test-data');
    const adminEventsResource = adminResource.addResource('events');

    adminUsersResource.addMethod('GET', new apigateway.LambdaIntegration(props.listUsersFunction));
    adminUserResource.addMethod('DELETE', new apigateway.LambdaIntegration(props.deleteUserFunction));
    adminCleanupResource.addMethod('POST', new apigateway.LambdaIntegration(props.cleanupAllFunction));
    adminTestDataResource.addMethod('POST', new apigateway.LambdaIntegration(props.generateTestDataFunction));
    adminEventsResource.addMethod('GET', new apigateway.LambdaIntegration(props.getEventsFunction));

    // Data service routes (if provided)
    if (props.postsDataServiceFunction) {
      const dataResource = this.api.root.addResource('data');
      const dataPostsResource = dataResource.addResource('posts');
      dataPostsResource.addMethod('ANY', new apigateway.LambdaIntegration(props.postsDataServiceFunction));
      dataPostsResource.addProxy({
        anyMethod: true,
        defaultIntegration: new apigateway.LambdaIntegration(props.postsDataServiceFunction),
      });
    }

    if (props.profilesDataServiceFunction) {
      const dataResource = this.api.root.getResource('data') || this.api.root.addResource('data');
      const dataProfilesResource = dataResource.addResource('profiles');
      dataProfilesResource.addMethod('ANY', new apigateway.LambdaIntegration(props.profilesDataServiceFunction));
      dataProfilesResource.addProxy({
        anyMethod: true,
        defaultIntegration: new apigateway.LambdaIntegration(props.profilesDataServiceFunction),
      });
    }

    // Static website hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `social-media-frontend-${cdk.Stack.of(this).account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/prod/*': {
          origin: new origins.RestApiOrigin(this.api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy frontend if it exists
    try {
      new s3deploy.BucketDeployment(this, 'DeployWebsite', {
        sources: [s3deploy.Source.asset('frontend/build')],
        destinationBucket: websiteBucket,
        distribution: this.distribution,
        distributionPaths: ['/*'],
      });
    } catch (error) {
      // Frontend build directory doesn't exist, skip deployment
      console.log('Frontend build directory not found, skipping deployment');
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });
  }
}