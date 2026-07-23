import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvType } from '../validators/env';

export type StoredObject = {
  body: Buffer;
  contentType: string;
};

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService<EnvType, true>) {
    this.bucket = this.configService.get('S3_BUCKET', { infer: true });

    this.s3Client = new S3Client({
      region: this.configService.get('S3_REGION', { infer: true }),
      endpoint: this.configService.get('S3_ENDPOINT', { infer: true }),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY_ID', {
          infer: true,
        }),
        secretAccessKey: this.configService.get('S3_SECRET_ACCESS_KEY', {
          infer: true,
        }),
      },
      forcePathStyle: true, // Required for SeaweedFS/MinIO
    });
  }

  getPublicUrl(key: string): string {
    const endpoint = this.configService.get('S3_ENDPOINT', { infer: true });
    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.configService.get('S3_REGION', { infer: true })}.amazonaws.com/${key}`;
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      await this.s3Client.send(command);

      return this.getPublicUrl(key);
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${key}`, error);
      throw error;
    }
  }

  async getFile(key: string): Promise<StoredObject> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const bytes = await response.Body?.transformToByteArray();

      if (!bytes) {
        throw new Error(`Empty object body for key: ${key}`);
      }

      return {
        body: Buffer.from(bytes),
        contentType: response.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Failed to get file from S3: ${key}`, error);
      throw error;
    }
  }

  async generatePresignedUrl(
    key: string,
    mimeType: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for key: ${key}`,
        error,
      );
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${key}`, error);
      throw error;
    }
  }
}
