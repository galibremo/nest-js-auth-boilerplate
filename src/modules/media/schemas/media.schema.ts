import { z } from 'zod';
import { validateString, validateUrl } from '../../../core/validators/common.schema';
import { createApiResponseSchema } from '../../../core/validators/api-response.schema';

export const UploadResponseSchema = z.object({
	url: validateUrl('URL'),
	key: validateString('Key'),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const UploadApiResponseSchema = createApiResponseSchema(UploadResponseSchema);
export type UploadApiResponse = z.infer<typeof UploadApiResponseSchema>;
