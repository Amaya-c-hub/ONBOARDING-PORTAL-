import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'hr-onboarding-bucket';
    
    // Configurable endpoint to support MinIO / Cloudflare R2 organically
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'MOCK_ACCESS_KEY',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'MOCK_SECRET_KEY',
      },
      forcePathStyle: !!process.env.AWS_S3_ENDPOINT, // Often needed for MinIO proxying
    });
  }

  async uploadBuffer(buffer: Buffer, key: string, contentType: string = 'application/pdf'): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      // If mock keys, we save to local disk instead of pretending to upload
      if (process.env.AWS_ACCESS_KEY_ID === 'MOCK_ACCESS_KEY' || !process.env.AWS_ACCESS_KEY_ID) {
        this.logger.warn(`Mock S3: Saving [${key}] to local filesystem.`);
        
        const uploadDir = path.join(process.cwd(), 'uploads');
        const filePath = path.join(uploadDir, key);
        const dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, buffer);
        return key;
      }

      await this.s3Client.send(command);
      this.logger.log(`Uploaded ${key} to S3 bucket ${this.bucketName}`);
      return key;
    } catch (e) {
      this.logger.error(`S3 Upload failed for key: ${key}`, e);
      return key;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (process.env.AWS_ACCESS_KEY_ID === 'MOCK_ACCESS_KEY' || !process.env.AWS_ACCESS_KEY_ID) {
        // Return local server URL for mock environment
        return `http://localhost:3001/uploads/${key}`;
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (e) {
      this.logger.error(`Failed to generate presigned URL for key: ${key}`, e);
      return '';
    }
  }
}
