import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { BaseLambda } from './base-lambda';

export interface ProfileFunctionsProps {
  /** DynamoDB table for data storage */
  table: dynamodb.Table;
  /** EventBridge bus for publishing events */
  eventBus: events.EventBus;
}

/**
 * Profile Functions construct containing user profile operations
 * - Create profile
 * - Get profile
 * - Update profile
 * - Follow/unfollow users
 * - Check follow status
 * - Get followers
 */
export class ProfileFunctions extends Construct {
  public readonly createProfileFunction: lambda.Function;
  public readonly getProfileFunction: lambda.Function;
  public readonly updateProfileFunction: lambda.Function;
  public readonly followUserFunction: lambda.Function;
  public readonly unfollowUserFunction: lambda.Function;
  public readonly checkFollowFunction: lambda.Function;
  public readonly getFollowersFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ProfileFunctionsProps) {
    super(scope, id);

    const environment = {
      TABLE_NAME: props.table.tableName,
      EVENT_BUS_NAME: props.eventBus.eventBusName,
    };

    // Create Profile Function (using ES modules)
    const createProfile = new BaseLambda(this, 'CreateProfile', {
      handler: 'create.handler',
      codeAssetPath: 'lambda/profile-esm',
      useESModules: true,
      environment,
      timeout: cdk.Duration.seconds(30),
    });
    this.createProfileFunction = createProfile.function;

    // Get Profile Function (using ES modules)
    const getProfile = new BaseLambda(this, 'GetProfile', {
      handler: 'get.handler',
      codeAssetPath: 'lambda/profile-esm',
      useESModules: true,
      environment: { TABLE_NAME: props.table.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    this.getProfileFunction = getProfile.function;

    // Update Profile Function (using ES modules)
    const updateProfile = new BaseLambda(this, 'UpdateProfile', {
      handler: 'update.handler',
      codeAssetPath: 'lambda/profile-esm',
      useESModules: true,
      environment,
      timeout: cdk.Duration.seconds(30),
    });
    this.updateProfileFunction = updateProfile.function;

    // Follow User Function (using ES modules)
    const followUser = new BaseLambda(this, 'FollowUser', {
      handler: 'follow.handler',
      codeAssetPath: 'lambda/social-esm',
      useESModules: true,
      environment,
      timeout: cdk.Duration.seconds(30),
    });
    this.followUserFunction = followUser.function;

    // Unfollow User Function (using ES modules)
    const unfollowUser = new BaseLambda(this, 'UnfollowUser', {
      handler: 'unfollow.handler',
      codeAssetPath: 'lambda/social-esm',
      useESModules: true,
      environment,
      timeout: cdk.Duration.seconds(30),
    });
    this.unfollowUserFunction = unfollowUser.function;

    // Check Follow Function (using ES modules)
    const checkFollow = new BaseLambda(this, 'CheckFollow', {
      handler: 'check-follow.handler',
      codeAssetPath: 'lambda/social-esm',
      useESModules: true,
      environment: { TABLE_NAME: props.table.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    this.checkFollowFunction = checkFollow.function;

    // Get Followers Function (using ES modules)
    const getFollowers = new BaseLambda(this, 'GetFollowers', {
      handler: 'get-followers.handler',
      codeAssetPath: 'lambda/social-esm',
      useESModules: true,
      environment: { TABLE_NAME: props.table.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    this.getFollowersFunction = getFollowers.function;

    // Grant DynamoDB permissions
    props.table.grantReadWriteData(this.createProfileFunction);
    props.table.grantReadData(this.getProfileFunction);
    props.table.grantReadWriteData(this.updateProfileFunction);
    props.table.grantReadWriteData(this.followUserFunction);
    props.table.grantReadWriteData(this.unfollowUserFunction);
    props.table.grantReadData(this.checkFollowFunction);
    props.table.grantReadData(this.getFollowersFunction);

    // Grant EventBridge permissions (for functions that publish events)
    props.eventBus.grantPutEventsTo(this.createProfileFunction);
    props.eventBus.grantPutEventsTo(this.updateProfileFunction);
    props.eventBus.grantPutEventsTo(this.followUserFunction);
    props.eventBus.grantPutEventsTo(this.unfollowUserFunction);
  }
}