import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import { baseQuerySchema, type SortableField } from '../../../core/validators/base-query.schema';
import {
	validateArray,
	validateBoolean,
	validateEmail,
	validateEnum,
	validateNumber,
	validateString,
	validateUUID,
} from '../../../core/validators/common.schema';

const EMAIL_LOG_SORTABLE_FIELDS: readonly SortableField[] = [
	{ name: 'toEmail', queryName: 'toEmail' },
	{ name: 'status', queryName: 'status' },
	{ name: 'templateKey', queryName: 'templateKey' },
	{ name: 'createdAt', queryName: 'createdAt' },
] as const;

export const EmailLogsListQuerySchema = baseQuerySchema(EMAIL_LOG_SORTABLE_FIELDS).safeExtend({
	providerId: validateString('Provider ID', { max: 100 }).optional(),
	toEmail: validateString('To Email', { max: 255 }).optional(),
	status: validateString('Status', { max: 20 }).optional(),
	templateKey: validateString('Template Key', { max: 100 }).optional(),
});

export const EmailLogResponseSchema = z.object({
	id: validateUUID('Email Log ID'),
	emailProviderId: validateString('Email Provider ID').nullable(),
	toEmail: validateEmail,
	toName: validateString('Recipient Name').nullable(),
	subject: validateString('Subject'),
	templateKey: validateString('Template Key').nullable(),
	status: validateEnum('Status', ['sent', 'failed']),
	errorMessage: validateString('Error Message').nullable(),
	metadata: z.record(z.string(), z.unknown()),
	createdAt: validateString('Created At'),
	updatedAt: validateString('Updated At'),
});

const EmailLogListResponseSchema = z.object({
	rows: validateArray('Email Logs', EmailLogResponseSchema),
	total: validateNumber('Total', { min: 0, int: true }),
	page: validateNumber('Page', { min: 1, int: true }),
	pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

const DeletedEmailLogResponseSchema = z.object({ deleted: validateBoolean('Deleted') });

export const EmailLogApiResponseSchema = createApiResponseSchema(EmailLogResponseSchema);
export const EmailLogListApiResponseSchema = createApiResponseSchema(EmailLogListResponseSchema);
export const DeletedEmailLogApiResponseSchema = createApiResponseSchema(DeletedEmailLogResponseSchema);

export type EmailLogsListQueryDto = z.infer<typeof EmailLogsListQuerySchema>;
export type EmailLogResponse = z.infer<typeof EmailLogResponseSchema>;
export type EmailLogListResponse = z.infer<typeof EmailLogListResponseSchema>;
export type EmailLogApiResponse = z.infer<typeof EmailLogApiResponseSchema>;
export type EmailLogListApiResponse = z.infer<typeof EmailLogListApiResponseSchema>;
export type DeletedEmailLogApiResponse = z.infer<typeof DeletedEmailLogApiResponseSchema>;
