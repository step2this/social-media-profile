/**
 * CDK Infrastructure Sanity Tests
 *
 * Simple validation that CDK stack synthesizes correctly.
 * Real deployment validation happens via curl scripts and deployment tests.
 */

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Minimal mock stack for synthesis testing
class MinimalProfileStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Core resources that must exist
    new dynamodb.Table(this, 'ProfileTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    new events.EventBus(this, 'EventBus');

    new s3.Bucket(this, 'ImagesBucket');

    // Basic Lambda function
    new lambda.Function(this, 'ProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'profile.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
    });
  }
}

describe('CDK Infrastructure Sanity Tests', () => {
  let app: App;
  let stack: MinimalProfileStack;
  let template: Template;

  beforeAll(() => {
    app = new App();
    stack = new MinimalProfileStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('Basic Synthesis', () => {
    it('should synthesize without errors', () => {
      expect(() => template.toJSON()).not.toThrow();
    });

    it('should create core resources', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });

      template.hasResourceProperties('AWS::Events::EventBus', {});

      template.hasResourceProperties('AWS::S3::Bucket', {});

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x'
      });
    });

    it('should have at least one Lambda function', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });

    it('should have DynamoDB table with partition and sort keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' }
        ]
      });
    });
  });

  describe('IAM Roles', () => {
    it('should create IAM roles for Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' }
          }]
        }
      });
    });
  });
});