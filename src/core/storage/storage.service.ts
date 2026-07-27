import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { EnvType } from '../validators/env';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService<EnvType, true>) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME', {
        infer: true,
      }),
      api_key: this.configService.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET', {
        infer: true,
      }),
    });
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string, // Kept for compatibility, though Cloudinary detects it
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: key,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            this.logger.error(
              `Failed to upload file to Cloudinary: ${key}`,
              error,
            );
            return reject(error);
          }
          if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Cloudinary upload returned no result'));
          }
        },
      );

      uploadStream.end(buffer);
    });
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(key);
    } catch (error) {
      this.logger.error(`Failed to delete file from Cloudinary: ${key}`, error);
      throw error;
    }
  }
}
