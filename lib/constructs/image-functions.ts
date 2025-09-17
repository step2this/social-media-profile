import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BaseLambda } from './base-lambda';

export interface ImageFunctionsProps {
  /** S3 bucket for image storage */
  imagesBucket: s3.Bucket;
}

/**
 * Image Functions construct containing image operations
 * - Generate upload URLs for images
 */
export class ImageFunctions extends Construct {
  public readonly imageUploadFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ImageFunctionsProps) {
    super(scope, id);

    // Image Upload Function (using ES modules)
    const imageUpload = new BaseLambda(this, 'ImageUpload', {
      handler: 'upload-url.handler',
      codeAssetPath: 'lambda/images-esm',
      useESModules: true,
      environment: {
        IMAGES_BUCKET_NAME: props.imagesBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.imageUploadFunction = imageUpload.function;

    // Grant S3 permissions
    props.imagesBucket.grantWrite(this.imageUploadFunction);
    props.imagesBucket.grantPutAcl(this.imageUploadFunction);
  }
}