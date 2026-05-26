import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly config: ConfigService) {
  this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION')!,
      credentials: {
      accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
  });
  this.bucket = this.config.get<string>('S3_BUCKET_NAME')!;
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          Metadata: metadata,
          ServerSideEncryption: 'AES256',
        }),
      );
      this.logger.log(`Uploaded to S3: ${key}`);
      return key;
    } catch (err) {
      this.logger.error(`S3 upload failed for key ${key}`, err);
      throw new InternalServerErrorException('File upload to S3 failed');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      this.logger.log(`Deleted from S3: ${key}`);
    } catch (err) {
      this.logger.error(`S3 delete failed for key ${key}`, err);
      throw new InternalServerErrorException('File deletion from S3 failed');
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }
}