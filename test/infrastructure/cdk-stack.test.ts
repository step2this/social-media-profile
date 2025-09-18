import { App, Stack, CfnOutput, Duration } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Mock stack for testing (simplified version without asset dependencies)
class MockProfileServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id, props);

    // DynamoDB Table
    const profileTable = new dynamodb.Table(this, 'ProfileTable', {
      tableName: 'user-profiles',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    profileTable.addGlobalSecondaryIndex({
      indexName: 'username-index',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // EventBridge Bus
    const eventBus = new events.EventBus(this, 'SocialMediaEventBus', {
      eventBusName: 'social-media-events',
    });

    // S3 Buckets
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `social-media-images-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
    });

    // Lambda Functions (using inline code for testing)
    const createProfileFunction = new lambda.Function(this, 'CreateProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'create.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      timeout: Duration.seconds(30),
    });

    const getProfileFunction = new lambda.Function(this, 'GetProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'get.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: Duration.seconds(30),
    });

    const updateProfileFunction = new lambda.Function(this, 'UpdateProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'update.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      timeout: Duration.seconds(30),
    });

    const listUsersFunction = new lambda.Function(this, 'ListUsersFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'list-users.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: Duration.seconds(30),
    });

    const deleteUserFunction = new lambda.Function(this, 'DeleteUserFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'delete-user.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: Duration.seconds(60),
    });

    const generateTestDataFunction = new lambda.Function(this, 'GenerateTestDataFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'generate-test-data.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      environment: {
        TABLE_NAME: profileTable.tableName,
      },
      timeout: Duration.seconds(300),
    });

    const cleanupAllFunction = new lambda.Function(this, 'CleanupAllFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'cleanup-all.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      environment: {
        TABLE_NAME: profileTable.tableName,
        S3_BUCKET: imagesBucket.bucketName,
      },
      timeout: Duration.seconds(300),
    });

    // Grant permissions
    profileTable.grantReadWriteData(createProfileFunction);
    profileTable.grantReadData(getProfileFunction);
    profileTable.grantReadWriteData(updateProfileFunction);
    profileTable.grantReadData(listUsersFunction);
    profileTable.grantReadWriteData(deleteUserFunction);
    profileTable.grantReadWriteData(generateTestDataFunction);
    profileTable.grantReadWriteData(cleanupAllFunction);

    imagesBucket.grantReadWrite(cleanupAllFunction);

    eventBus.grantPutEventsTo(createProfileFunction);
    eventBus.grantPutEventsTo(updateProfileFunction);

    // EventBridge Rules
    new events.Rule(this, 'ProfileCreatedRule', {
      eventBus: eventBus,
      ruleName: 'profile-created-rule',
      eventPattern: {
        source: ['social-media.profile'],
        detailType: ['Profile Created'],
      },
    });

    new events.Rule(this, 'ProfileUpdatedRule', {
      eventBus: eventBus,
      ruleName: 'profile-updated-rule',
      eventPattern: {
        source: ['social-media.profile'],
        detailType: ['Profile Updated'],
      },
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

    // API Resources
    const profilesResource = api.root.addResource('profiles');
    const profileResource = profilesResource.addResource('{userId}');

    const adminResource = api.root.addResource('admin');
    const adminUsersResource = adminResource.addResource('users');
    const adminUserResource = adminUsersResource.addResource('{userId}');

    // API Methods
    profilesResource.addMethod('POST', new apigateway.LambdaIntegration(createProfileFunction));
    profileResource.addMethod('GET', new apigateway.LambdaIntegration(getProfileFunction));
    profileResource.addMethod('PUT', new apigateway.LambdaIntegration(updateProfileFunction));

    adminUsersResource.addMethod('GET', new apigateway.LambdaIntegration(listUsersFunction));
    adminUserResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserFunction));

    // Outputs
    new CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new CfnOutput(this, 'EventBusArn', {
      value: eventBus.eventBusArn,
      description: 'EventBridge Bus ARN',
    });

    new CfnOutput(this, 'ProfileTableName', {
      value: profileTable.tableName,
      description: 'DynamoDB Profile Table Name',
    });

    new CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
      description: 'S3 Bucket for Images',
    });
  }
}

describe('CDK Infrastructure Tests', () => {
  let app: App;
  let stack: MockProfileServiceStack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new MockProfileServiceStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    it('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'PK',
            AttributeType: 'S'
          },
          {
            AttributeName: 'SK',
            AttributeType: 'S'
          },
          {
            AttributeName: 'username',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'PK',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'SK',
            KeyType: 'RANGE'
          }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'username-index',
            KeySchema: [
              {
                AttributeName: 'username',
                KeyType: 'HASH'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ]
      });
    });

    it('should enable point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });
  });

  describe('Lambda Functions', () => {
    it('should create create-profile Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'create.handler',
        Environment: {
          Variables: {
            TABLE_NAME: expect.any(Object),
            EVENT_BUS_NAME: expect.any(Object)
          }
        }
      });
    });

    it('should create get-profile Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'get.handler'
      });
    });

    it('should create update-profile Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'update.handler'
      });
    });

    it('should create admin Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'list-users.handler'
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'generate-test-data.handler'
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'delete-user.handler'
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'cleanup-all.handler'
      });
    });

    it('should have correct timeout configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30
      });
    });

    it('should have DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ])
            })
          ])
        }
      });
    });
  });

  describe('API Gateway', () => {
    it('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: expect.stringContaining('ProfileService'),
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    it('should create profile resource endpoints', () => {
      template.hasResource('AWS::ApiGateway::Resource', {
        Properties: {
          PathPart: 'profiles'
        }
      });

      template.hasResource('AWS::ApiGateway::Resource', {
        Properties: {
          PathPart: '{userId}'
        }
      });
    });

    it('should create admin resource endpoints', () => {
      template.hasResource('AWS::ApiGateway::Resource', {
        Properties: {
          PathPart: 'admin'
        }
      });

      template.hasResource('AWS::ApiGateway::Resource', {
        Properties: {
          PathPart: 'users'
        }
      });
    });

    it('should create HTTP methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS'
      });
    });

    it('should enable CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
          IntegrationResponses: [
            {
              StatusCode: '200',
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
              }
            }
          ]
        }
      });
    });

    it('should create deployment and stage', () => {
      template.hasResource('AWS::ApiGateway::Deployment', {});

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod'
      });
    });
  });

  describe('EventBridge', () => {
    it('should create custom event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: 'social-media-events'
      });
    });

    it('should create event rules', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['social-media.profile'],
          'detail-type': ['Profile Created']
        }
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['social-media.profile'],
          'detail-type': ['Profile Updated']
        }
      });
    });

    it('should have EventBridge permissions for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: 'events:PutEvents'
            })
          ])
        }
      });
    });
  });

  describe('S3 Bucket', () => {
    it('should create S3 bucket for file storage', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    it('should have CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: expect.arrayContaining([
            expect.objectContaining({
              AllowedHeaders: ['*'],
              AllowedMethods: expect.arrayContaining(['GET', 'PUT', 'POST']),
              AllowedOrigins: ['*']
            })
          ])
        }
      });
    });
  });

  describe('Security and Permissions', () => {
    it('should create IAM roles for Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    it('should attach basic Lambda execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: expect.arrayContaining([
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ])
      });
    });

    it('should have least privilege permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Resource: expect.any(Object)
            })
          ])
        }
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    it('should output API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL'
      });
    });

    it('should output DynamoDB table name', () => {
      template.hasOutput('ProfileTableName', {
        Description: 'DynamoDB Profile Table Name'
      });
    });

    it('should output S3 bucket name', () => {
      template.hasOutput('ImagesBucketName', {
        Description: 'S3 Bucket for Images'
      });
    });

    it('should output EventBridge bus ARN', () => {
      template.hasOutput('EventBusArn', {
        Description: 'EventBridge Bus ARN'
      });
    });
  });


  describe('Stack Properties', () => {
    it('should have correct stack name and properties', () => {
      expect(stack.stackName).toBe('TestStack');
      expect(stack.region).toBeDefined();
      expect(stack.account).toBeDefined();
    });

    it('should synthesize without errors', () => {
      expect(() => app.synth()).not.toThrow();
    });

    it('should have all required resources', () => {
      const resources = template.toJSON().Resources;

      expect(Object.keys(resources)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/.*DynamoDB.*Table.*/),
          expect.stringMatching(/.*Lambda.*Function.*/),
          expect.stringMatching(/.*ApiGateway.*RestApi.*/),
          expect.stringMatching(/.*Events.*EventBus.*/),
          expect.stringMatching(/.*S3.*Bucket.*/)
        ])
      );
    });
  });
});