import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as path from 'path';
import 'multer';

import { badRequestError, notFoundError } from '../../core/errors/domain-error';
import { StorageService } from '../../core/storage/storage.service';
import type { EnvType } from '../../core/validators/env';
import { MediaPolicy } from './media.policy';
import type { PresignedUrlInput, PresignedUrlResponse, UploadResponse } from './schemas/media.schema';

const PUBLIC_PROFILE_PREFIX = 'profiles/';

@Injectable()
export class MediaService {
	constructor(
		private readonly storageService: StorageService,
		private readonly configService: ConfigService<EnvType, true>,
	) {}

	async generatePresignedUrl(
		actor: CurrentUser,
		input: PresignedUrlInput,
	): Promise<PresignedUrlResponse> {
		MediaPolicy.assertCanUpload(actor);

		const ext = path.extname(input.fileName);
		const key = input.folder
			? `${input.folder}/${crypto.randomUUID()}${ext}`
			: `${crypto.randomUUID()}${ext}`;

		const url = await this.storageService.generatePresignedUrl(key, input.contentType);
		const publicUrl = this.storageService.getPublicUrl(key);

		return { url, key, publicUrl };
	}

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
		const key = folder ? `${folder}/${crypto.randomUUID()}${ext}` : `${crypto.randomUUID()}${ext}`;

		const url = await this.storageService.uploadFile(file.buffer, key, file.mimetype);

		return { url, key };
	}

	/** Upload a profile avatar and return a same-origin API URL the browser can load over HTTPS. */
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
	async storeProfileWebp(buffer: Buffer): Promise<UploadResponse & { publicUrl: string }> {
		const key = `${PUBLIC_PROFILE_PREFIX}${crypto.randomUUID()}.webp`;
		await this.storageService.uploadFile(buffer, key, 'image/webp');
		const publicUrl = this.buildProfilePublicUrl(key);

		return {
			url: publicUrl,
			key,
			publicUrl,
		};
	}

	async getPublicProfileObject(key: string) {
		const normalizedKey = key.replace(/^\/+/, '');
		if (!normalizedKey.startsWith(PUBLIC_PROFILE_PREFIX) || normalizedKey.includes('..')) {
			throw notFoundError('profile_image_not_found', 'Profile image not found.');
		}

		try {
			return await this.storageService.getFile(normalizedKey);
		} catch {
			throw notFoundError('profile_image_not_found', 'Profile image not found.');
		}
	}

	private buildProfilePublicUrl(key: string): string {
		const apiBase = this.configService.get('BETTER_AUTH_URL', { infer: true }).replace(/\/$/, '');
		return `${apiBase}/media/public/${key}`;
	}
}
