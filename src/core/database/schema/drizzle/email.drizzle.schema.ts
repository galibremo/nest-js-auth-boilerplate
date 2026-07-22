import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';

type EmailTemplateVariable = {
	name: string;
	type: 'string' | 'number' | 'boolean';
	required: boolean;
	description: string;
};

export const emailProviders = pgTable(
	'email_providers',
	{
		id: serial('id').primaryKey(),
		publicId: uuid('public_id').defaultRandom().notNull().unique(),
		name: text('name').notNull(),
		providerType: text('provider_type').notNull(),
		config: text('config').notNull(),
		isDefault: boolean('is_default').default(false).notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),
		lastTestStatus: text('last_test_status'),
		...timestamps,
	},
	table => [
		index('email_providers_provider_type_idx').on(table.providerType),
		index('email_providers_is_default_idx').on(table.isDefault),
		index('email_providers_is_active_idx').on(table.isActive),
	],
);

export const emailLogs = pgTable(
	'email_logs',
	{
		id: serial('id').primaryKey(),
		publicId: uuid('public_id').defaultRandom().notNull().unique(),
		emailProviderId: integer('email_provider_id').references(() => emailProviders.id, {
			onDelete: 'set null',
		}),
		toEmail: text('to_email').notNull(),
		toName: text('to_name'),
		subject: text('subject').notNull(),
		templateKey: text('template_key'),
		status: text('status').notNull(),
		errorMessage: text('error_message'),
		metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
		...timestamps,
	},
	table => [
		index('email_logs_email_provider_id_idx').on(table.emailProviderId),
		index('email_logs_to_email_idx').on(table.toEmail),
		index('email_logs_status_idx').on(table.status),
		index('email_logs_template_key_idx').on(table.templateKey),
		index('email_logs_created_at_idx').on(table.createdAt),
	],
);

export const emailTemplates = pgTable(
	'email_templates',
	{
		id: serial('id').primaryKey(),
		publicId: uuid('public_id').defaultRandom().notNull().unique(),
		key: text('key').notNull(),
		subject: text('subject').notNull(),
		html: text('html').notNull(),
		text: text('text'),
		variables: jsonb('variables').$type<EmailTemplateVariable[]>().default([]).notNull(),
		version: integer('version').default(1).notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		...timestamps,
	},
	table => [
		uniqueIndex('email_templates_key_version_idx').on(table.key, table.version),
		index('email_templates_key_idx').on(table.key),
		index('email_templates_is_active_idx').on(table.isActive),
	],
);
