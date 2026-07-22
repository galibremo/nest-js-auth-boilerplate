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
	validateUrl,
} from '../../../core/validators/common.schema';
import {
	EMAIL_PROVIDER_TYPES,
	type EmailProviderType,
	type EmailProviderConfig,
} from '../email-provider.interface';

export const EMAIL_PROVIDER_CONFIG_TYPES = EMAIL_PROVIDER_TYPES;

const EMAIL_PROVIDER_SORTABLE_FIELDS: readonly SortableField[] = [
	{ name: 'name', queryName: 'name' },
	{ name: 'providerType', queryName: 'providerType' },
	{ name: 'isDefault', queryName: 'isDefault' },
	{ name: 'isActive', queryName: 'isActive' },
	{ name: 'lastTestStatus', queryName: 'lastTestStatus' },
	{ name: 'createdAt', queryName: 'createdAt' },
	{ name: 'updatedAt', queryName: 'updatedAt' },
] as const;

const ProviderTypeSchema = validateEnum('Provider Type', EMAIL_PROVIDER_CONFIG_TYPES);
const optionalString = (name: string, max = 255) => validateString(name, { max }).optional();
const optionalUrl = (name: string) => validateUrl(name).optional();
const optionalBoolean = (name: string) =>
	z.preprocess(value => {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'string') return value.toLowerCase() === 'true';
		return value;
	}, validateBoolean(name).optional());
const optionalPositiveInteger = (name: string) =>
	validateNumber(name, { min: 1, positive: true, int: true }).optional();
const HeaderRecordSchema = z.record(z.string(), validateString('Header Value')).optional();

const SenderSchema = {
	senderEmail: validateEmail,
	senderName: validateString('Sender Name', { max: 100 }),
};

const ApiKeySchema = {
	apiKey: validateString('API Key'),
	baseUrl: optionalUrl('Base URL'),
};

const ApiKeyWithHeadersSchema = {
	...ApiKeySchema,
	headers: HeaderRecordSchema,
};

const BrevoConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const CloudflareConfigSchema = z
	.object({
		apiToken: validateString('API Token'),
		accountId: validateString('Account ID'),
		baseUrl: optionalUrl('Base URL'),
		...SenderSchema,
	})
	.strict();
const IterableConfigSchema = z
	.object({
		apiKey: validateString('API Key'),
		campaignId: validateNumber('Campaign ID', { min: 1, positive: true, int: true }),
		allowRepeatMarketingSends: optionalBoolean('Allow Repeat Marketing Sends'),
		dataFields: z.record(z.string(), z.unknown()).optional(),
		sendAt: optionalString('Send At'),
		baseUrl: optionalUrl('Base URL'),
		...SenderSchema,
	})
	.strict();
const JetemailConfigSchema = z.object({ ...ApiKeyWithHeadersSchema, ...SenderSchema }).strict();
const LettermintConfigSchema = z
	.object({
		apiToken: validateString('API Token'),
		baseUrl: optionalUrl('Base URL'),
		route: optionalString('Route'),
		headers: HeaderRecordSchema,
		...SenderSchema,
	})
	.strict();
const LoopsConfigSchema = z
	.object({
		apiKey: validateString('API Key'),
		transactionalId: validateString('Transactional ID'),
		baseUrl: optionalUrl('Base URL'),
		...SenderSchema,
	})
	.strict();
const MailchimpConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const MailersendConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const MailgunConfigSchema = z
	.object({
		apiKey: validateString('API Key'),
		domain: validateString('Domain'),
		baseUrl: optionalUrl('Base URL'),
		...SenderSchema,
	})
	.strict();
const MailpaceConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const MailtrapConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const PlunkConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const PostmarkConfigSchema = z
	.object({
		serverToken: validateString('Server Token'),
		baseUrl: optionalUrl('Base URL'),
		messageStream: optionalString('Message Stream'),
		headers: HeaderRecordSchema,
		...SenderSchema,
	})
	.strict();
const PrimitiveConfigSchema = z.object({ ...ApiKeyWithHeadersSchema, ...SenderSchema }).strict();
const ResendConfigSchema = z.object({ ...ApiKeyWithHeadersSchema, ...SenderSchema }).strict();
const ScalewayConfigSchema = z
	.object({
		secretKey: validateString('Secret Key'),
		projectId: validateString('Project ID'),
		region: optionalString('Region'),
		baseUrl: optionalUrl('Base URL'),
		...SenderSchema,
	})
	.strict();
const SendgridConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const SequenzyConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const SesConfigSchema = z
	.object({
		accessKeyId: validateString('Access Key ID'),
		secretAccessKey: validateString('Secret Access Key'),
		region: validateString('Region'),
		sessionToken: optionalString('Session Token'),
		baseUrl: optionalUrl('Base URL'),
		charset: optionalString('Charset'),
		configurationSetName: optionalString('Configuration Set Name'),
		...SenderSchema,
	})
	.strict();
const EmailServerConfigSchema = z
	.object({
		host: validateString('Host'),
		port: optionalPositiveInteger('Port'),
		secure: optionalBoolean('Secure'),
		auth: z
			.object({
				user: validateString('Username'),
				pass: validateString('Password'),
				method: validateEnum('Email Auth Method', ['plain', 'login']).optional(),
			})
			.strict()
			.optional(),
		defaults: z
			.object({
				replyTo: validateString('Default Reply To').optional(),
			})
			.strict()
			.optional(),
		tls: z.record(z.string(), z.unknown()).optional(),
		requireTLS: optionalBoolean('Require TLS'),
		allowInsecureAuth: optionalBoolean('Allow Insecure Auth'),
		name: optionalString('Email Server Name'),
		heloName: optionalString('HELO Name'),
		timeoutMs: optionalPositiveInteger('Timeout MS'),
		...SenderSchema,
	})
	.strict();
const SparkpostConfigSchema = z
	.object({
		apiKey: validateString('API Key'),
		baseUrl: optionalUrl('Base URL'),
		sandbox: optionalBoolean('Sandbox'),
		...SenderSchema,
	})
	.strict();
const UnosendConfigSchema = z.object({ ...ApiKeySchema, ...SenderSchema }).strict();
const ZeptomailConfigSchema = z
	.object({
		token: validateString('Token'),
		baseUrl: optionalUrl('Base URL'),
		...SenderSchema,
	})
	.strict();

export const EmailProviderConfigSchemaByType = {
	resend: ResendConfigSchema,
	postmark: PostmarkConfigSchema,
	sendgrid: SendgridConfigSchema,
	cloudflare: CloudflareConfigSchema,
	unosend: UnosendConfigSchema,
	iterable: IterableConfigSchema,
	ses: SesConfigSchema,
	mailgun: MailgunConfigSchema,
	mailersend: MailersendConfigSchema,
	brevo: BrevoConfigSchema,
	mailchimp: MailchimpConfigSchema,
	sparkpost: SparkpostConfigSchema,
	loops: LoopsConfigSchema,
	sequenzy: SequenzyConfigSchema,
	jetemail: JetemailConfigSchema,
	lettermint: LettermintConfigSchema,
	primitive: PrimitiveConfigSchema,
	plunk: PlunkConfigSchema,
	mailtrap: MailtrapConfigSchema,
	scaleway: ScalewayConfigSchema,
	zeptomail: ZeptomailConfigSchema,
	mailpace: MailpaceConfigSchema,
	email: EmailServerConfigSchema,
} satisfies Record<EmailProviderType, z.ZodTypeAny>;

export function parseEmailProviderConfig(
	providerType: EmailProviderType,
	config: unknown,
): EmailProviderConfig {
	return EmailProviderConfigSchemaByType[providerType].parse(config);
}

export const CreateEmailProviderSchema = z
	.object({
		name: validateString('Name', { max: 100 }),
		providerType: ProviderTypeSchema,
		config: z.unknown(),
	})
	.strict()
	.superRefine((data, context) => {
		const result = EmailProviderConfigSchemaByType[data.providerType].safeParse(data.config);
		if (result.success) return;

		for (const issue of result.error.issues) {
			context.addIssue({ ...issue, path: ['config', ...issue.path] });
		}
	});

export const UpdateEmailProviderSchema = z
	.object({
		name: validateString('Name', { max: 100 }).optional(),
		config: z.unknown().optional(),
	})
	.strict()
	.refine(data => Object.keys(data).length > 0, {
		message: 'At least one field must be provided',
	});

export const TestEmailProviderSchema = z
	.object({
		to: z
			.object({
				email: validateEmail,
				name: validateString('Recipient Name', { max: 100 }).optional(),
			})
			.strict(),
		subject: validateString('Subject', { max: 255 }).optional(),
		text: validateString('Text').optional(),
		html: validateString('HTML').optional(),
	})
	.strict();

export const EmailProvidersListQuerySchema = baseQuerySchema(EMAIL_PROVIDER_SORTABLE_FIELDS).safeExtend({
	providerType: ProviderTypeSchema.optional(),
	isActive: z.preprocess(value => {
		if (typeof value !== 'string') return undefined;
		const normalized = value.trim().toLowerCase();
		return normalized === 'true' ? true : normalized === 'false' ? false : undefined;
	}, validateBoolean('Is Active').optional()),
});

export const EmailProviderResponseSchema = z.object({
	id: validateString('Email Provider ID'),
	name: validateString('Name'),
	providerType: ProviderTypeSchema,
	config: z.record(z.string(), z.unknown()),
	isDefault: validateBoolean('Is Default'),
	isActive: validateBoolean('Is Active'),
	lastTestedAt: validateString('Last Tested At').nullable(),
	lastTestStatus: validateString('Last Test Status').nullable(),
	createdAt: validateString('Created At'),
	updatedAt: validateString('Updated At'),
});

const EmailProviderListResponseSchema = z.object({
	rows: validateArray('Email Providers', EmailProviderResponseSchema),
	total: validateNumber('Total', { min: 0, int: true }),
	page: validateNumber('Page', { min: 1, int: true }),
	pageSize: validateNumber('Page Size', { min: 1, int: true }),
});
const TestConnectionResponseSchema = z.object({
	success: validateBoolean('Success'),
	message: validateString('Message'),
});
const DeletedEmailProviderResponseSchema = z.object({ deleted: validateBoolean('Deleted') });

export const EmailProviderApiResponseSchema = createApiResponseSchema(EmailProviderResponseSchema);
export const EmailProviderListApiResponseSchema = createApiResponseSchema(EmailProviderListResponseSchema);
export const TestConnectionApiResponseSchema = createApiResponseSchema(TestConnectionResponseSchema);
export const DeletedEmailProviderApiResponseSchema = createApiResponseSchema(DeletedEmailProviderResponseSchema);

export type CreateEmailProviderDto = z.infer<typeof CreateEmailProviderSchema>;
export type UpdateEmailProviderDto = z.infer<typeof UpdateEmailProviderSchema>;
export type TestEmailProviderDto = z.infer<typeof TestEmailProviderSchema>;
export type EmailProvidersListQueryDto = z.infer<typeof EmailProvidersListQuerySchema>;
export type EmailProviderResponse = z.infer<typeof EmailProviderResponseSchema>;
export type EmailProviderListResponse = z.infer<typeof EmailProviderListResponseSchema>;
export type TestConnectionResponse = z.infer<typeof TestConnectionResponseSchema>;
export type EmailProviderApiResponse = z.infer<typeof EmailProviderApiResponseSchema>;
export type EmailProviderListApiResponse = z.infer<typeof EmailProviderListApiResponseSchema>;
export type TestConnectionApiResponse = z.infer<typeof TestConnectionApiResponseSchema>;
export type DeletedEmailProviderApiResponse = z.infer<typeof DeletedEmailProviderApiResponseSchema>;
