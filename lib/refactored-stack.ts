import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { RUNTIME_CONFIG } from './constants/runtime-config';

// Import our constructs
import { DataLayer } from './constructs/data-layer';
import { ProfileFunctions } from './constructs/profile-functions';
import { PostsFunctions } from './constructs/posts-functions';
import { SocialFunctions } from './constructs/social-functions';
import { ImageFunctions } from './constructs/image-functions';
import { AdminFunctions } from './constructs/admin-functions';
import { EventProcessingFunctions } from './constructs/event-processing-functions';
import { ApiGatewayConstruct } from './constructs/api-gateway';

/**
 * Refactored Social Media Profile Service Stack
 *
 * This stack uses a modular construct-based architecture with:
 * - Data Layer: DynamoDB, S3, EventBridge
 * - Function Groups: Organized by domain (profiles, posts, social, etc.)
 * - API Gateway: Centralized REST API
 * - Event Processing: EventBridge-driven functions
 */
export class RefactoredProfileServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Data Layer - Shared infrastructure
    const dataLayer = new DataLayer(this, 'DataLayer', {
      tableName: 'user-profiles',
      eventBusName: 'social-media-events',
    });

    // Profile Functions - User profile operations
    const profileFunctions = new ProfileFunctions(this, 'ProfileFunctions', {
      table: dataLayer.table,
      eventBus: dataLayer.eventBus,
    });

    // Posts Functions - Post operations
    const postsFunctions = new PostsFunctions(this, 'PostsFunctions', {
      table: dataLayer.table,
      eventBus: dataLayer.eventBus,
    });

    // Social Functions - Like, feed operations
    const socialFunctions = new SocialFunctions(this, 'SocialFunctions', {
      table: dataLayer.table,
      eventBus: dataLayer.eventBus,
    });

    // Image Functions - Image upload operations
    const imageFunctions = new ImageFunctions(this, 'ImageFunctions', {
      imagesBucket: dataLayer.imagesBucket,
    });

    // Admin Functions - Created first without API URL to break circular dependency
    const adminFunctions = new AdminFunctions(this, 'AdminFunctions', {
      table: dataLayer.table,
      eventBus: dataLayer.eventBus,
      imagesBucket: dataLayer.imagesBucket,
      // apiUrl will be added later after API Gateway is created
    });

    // Data Service Lambda Functions (legacy, kept for compatibility)
    const postsDataServiceFunction = new lambda.Function(this, 'PostsDataServiceFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Posts data service placeholder' })
          };
        };
      `),
      timeout: cdk.Duration.seconds(30),
    });

    const profilesDataServiceFunction = new lambda.Function(this, 'ProfilesDataServiceFunction', {
      runtime: RUNTIME_CONFIG.LAMBDA_RUNTIME,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Profiles data service placeholder' })
          };
        };
      `),
      timeout: cdk.Duration.seconds(30),
    });

    // API Gateway - Must be created after data service functions for URL reference
    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      // Profile Functions
      createProfileFunction: profileFunctions.createProfileFunction,
      getProfileFunction: profileFunctions.getProfileFunction,
      updateProfileFunction: profileFunctions.updateProfileFunction,
      followUserFunction: profileFunctions.followUserFunction,
      unfollowUserFunction: profileFunctions.unfollowUserFunction,
      checkFollowFunction: profileFunctions.checkFollowFunction,
      getFollowersFunction: profileFunctions.getFollowersFunction,

      // Posts Functions
      createPostFunction: postsFunctions.createPostFunction,
      getUserPostsFunction: postsFunctions.getUserPostsFunction,

      // Social Functions
      likePostFunction: socialFunctions.likePostFunction,
      unlikePostFunction: socialFunctions.unlikePostFunction,
      checkLikeStatusFunction: socialFunctions.checkLikeStatusFunction,
      getFeedFunction: socialFunctions.getFeedFunction,
      createFeedItemsFunction: socialFunctions.createFeedItemsFunction,

      // Image Functions
      imageUploadFunction: imageFunctions.imageUploadFunction,

      // Admin Functions - Now using real functions instead of placeholders
      listUsersFunction: adminFunctions.listUsersFunction,
      deleteUserFunction: adminFunctions.deleteUserFunction,
      cleanupAllFunction: adminFunctions.cleanupAllFunction,
      generateTestDataFunction: adminFunctions.generateTestDataFunction,
      getEventsFunction: adminFunctions.getEventsFunction,

      // Data Service Functions
      postsDataServiceFunction,
      profilesDataServiceFunction,
    });

    // Event Processing Functions - Created after API Gateway to access URL
    const eventProcessingFunctions = new EventProcessingFunctions(this, 'EventProcessingFunctions', {
      table: dataLayer.table,
      eventBus: dataLayer.eventBus,
      apiUrl: apiGateway.api.url,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'StackSummary', {
      value: JSON.stringify({
        tableName: dataLayer.table.tableName,
        eventBusName: dataLayer.eventBus.eventBusName,
        bucketName: dataLayer.imagesBucket.bucketName,
        apiUrl: apiGateway.api.url,
        constructs: {
          dataLayer: 'DataLayer',
          profileFunctions: 'ProfileFunctions (7 functions)',
          postsFunctions: 'PostsFunctions (2 functions)',
          socialFunctions: 'SocialFunctions (5 functions)',
          imageFunctions: 'ImageFunctions (1 function)',
          adminFunctions: 'AdminFunctions (5 functions)',
          eventProcessing: 'EventProcessingFunctions (2 functions)',
          apiGateway: 'ApiGateway (with CloudFront)',
        }
      }, null, 2),
      description: 'Refactored stack summary with construct organization',
    });
  }
}