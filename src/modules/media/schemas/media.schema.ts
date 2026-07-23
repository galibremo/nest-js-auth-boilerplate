import { z } from 'zod';
import { validateString, validateUrl } from '../../../core/validators/common.schema';
import { createApiResponseSchema } from '../../../core/validators/api-response.schema';

export const PresignedUrlInputSchema = z.object({
	fileName: validateString('fileName', { min: 1, max: 255 }),
	contentType: validateString('contentType', { min: 1, max: 100 }),
	folder: validateString('folder').optional(),
});

export type PresignedUrlInput = z.infer<typeof PresignedUrlInputSchema>;

export const PresignedUrlResponseSchema = z.object({
	url: validateUrl('URL'),
	key: validateString('Key'),
	publicUrl: validateUrl('Public URL'),
});

export type PresignedUrlResponse = z.infer<typeof PresignedUrlResponseSchema>;

export const UploadResponseSchema = z.object({
	url: validateUrl('URL'),
	key: validateString('Key'),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const PresignedUrlApiResponseSchema = createApiResponseSchema(PresignedUrlResponseSchema);
export type PresignedUrlApiResponse = z.infer<typeof PresignedUrlApiResponseSchema>;

export const UploadApiResponseSchema = createApiResponseSchema(UploadResponseSchema);
export type UploadApiResponse = z.infer<typeof UploadApiResponseSchema>;
