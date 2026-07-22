import type { InferSelectModel } from 'drizzle-orm';

import { sessions, users } from '../schema/drizzle/auth.drizzle.schema';
import { roleTypeEnum } from '../schema/drizzle/enum.drizzle.schema';
import {
  emailLogs,
  emailProviders,
  emailTemplates,
} from '../schema/drizzle/email.drizzle.schema';

/**
 * Schema Types
 */
export type UserSchemaType = InferSelectModel<typeof users>;
export type SessionsSchemaType = InferSelectModel<typeof sessions>;
export type EmailProviderSchemaType = InferSelectModel<typeof emailProviders>;
export type EmailLogSchemaType = InferSelectModel<typeof emailLogs>;
export type EmailTemplateSchemaType = InferSelectModel<typeof emailTemplates>;

/**
 * Enum Schema Types
 */

export type RoleTypeEnum = (typeof roleTypeEnum.enumValues)[number];
