#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RefactoredProfileServiceStack } from '../lib/refactored-stack';
// Keep old stack available for reference
// import { ProfileServiceStack } from '../lib/social-media-profile-stack';

const app = new cdk.App();

// Using the new refactored modular stack architecture
new RefactoredProfileServiceStack(app, 'ProfileServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Previous monolithic stack (commented out)
// new ProfileServiceStack(app, 'ProfileServiceStack', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   },
// });
