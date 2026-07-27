import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import 'multer';

import { badRequestError } from '../../core/errors/domain-error';
import { StorageService } from '../../core/storage/storage.service';
import { MediaPolicy } from './media.policy';
import type { UploadResponse } from './schemas/media.schema';

const PUBLIC_PROFILE_PREFIX = 'profiles/';

@Injectable()
export class MediaService {
  constructor(private readonly storageService: StorageService) {}

  async uploadFile(
    actor: CurrentUser,
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResponse> {
    MediaPolicy.assertCanUpload(actor);

    if (!file) {
      throw badRequestError('No file provided.');
    }

    const ext = path.extname(file.originalname);
    const key = folder
      ? `${folder}/${crypto.randomUUID()}${ext}`
      : `${crypto.randomUUID()}${ext}`;

    const url = await this.storageService.uploadFile(
      file.buffer,
      key,
      file.mimetype,
    );

    return { url, key };
  }

  /** Upload a profile avatar and return a Cloudinary URL */
  async uploadProfileImage(
    actor: CurrentUser,
    file: Express.Multer.File,
  ): Promise<UploadResponse & { publicUrl: string }> {
    MediaPolicy.assertCanUpload(actor);

    if (!file) {
      throw badRequestError('No file provided.');
    }

    return this.storeProfileWebp(file.buffer);
  }

  /** Internal profile avatar store (already-optimized WebP buffer). No auth check. */
  async storeProfileWebp(
    buffer: Buffer,
  ): Promise<UploadResponse & { publicUrl: string }> {
    const key = `${PUBLIC_PROFILE_PREFIX}${crypto.randomUUID()}`; // Cloudinary doesn't need extension in public_id
    const publicUrl = await this.storageService.uploadFile(
      buffer,
      key,
      'image/webp',
    );

    return {
      url: publicUrl,
      key,
      publicUrl,
    };
  }
}
