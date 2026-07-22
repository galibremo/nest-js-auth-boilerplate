import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
	validateArray,
	validateBoolean,
	validateDate,
	validateEnum,
	validateNumber,
	validateString,
	validateUUID,
} from '../../../core/validators/common.schema';

export const UpdateEmailTemplateSchema = z
	.object({
		subject: validateString('Subject').optional(),
		html: validateString('HTML').optional(),
		text: validateString('Text').optional(),
		isActive: validateBoolean('Is Active').optional(),
	})
	.strict()
	.refine(data => Object.keys(data).length > 0, {
		message: 'At least one field must be provided',
	});

export type UpdateEmailTemplateDto = z.infer<typeof UpdateEmailTemplateSchema>;

const TemplateVariableDescriptorSchema = z.object({
	name: validateString('Variable Name'),
	type: validateEnum('Variable Type', ['string', 'number', 'boolean']),
	required: validateBoolean('Required'),
	description: validateString('Description'),
});

export const EmailTemplateResponseSchema = z.object({
	publicId: validateUUID('Email Template ID'),
	key: validateString('Template Key'),
	subject: validateString('Subject'),
	html: validateString('HTML'),
	text: validateString('Text').nullable(),
	variables: validateArray('Variables', TemplateVariableDescriptorSchema),
	version: validateNumber('Version', { min: 1, int: true }),
	isActive: validateBoolean('Is Active'),
	createdAt: validateDate('Created At').transform(value => value.toISOString()),
	updatedAt: validateDate('Updated At').transform(value => value.toISOString()),
});

const EmailTemplateListResponseSchema = z.object({
	rows: validateArray('Email Templates', EmailTemplateResponseSchema),
	total: validateNumber('Total', { min: 0, int: true }),
	page: validateNumber('Page', { min: 1, int: true }),
	pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const EmailTemplateApiResponseSchema = createApiResponseSchema(EmailTemplateResponseSchema);
export const EmailTemplateListApiResponseSchema = createApiResponseSchema(EmailTemplateListResponseSchema);

export type EmailTemplateResponse = z.infer<typeof EmailTemplateResponseSchema>;
export type EmailTemplateListResponse = z.infer<typeof EmailTemplateListResponseSchema>;
export type EmailTemplateApiResponse = z.infer<typeof EmailTemplateApiResponseSchema>;
export type EmailTemplateListApiResponse = z.infer<typeof EmailTemplateListApiResponseSchema>;
