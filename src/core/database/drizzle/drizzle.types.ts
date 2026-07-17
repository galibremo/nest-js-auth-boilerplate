import type { InferSelectModel } from 'drizzle-orm';

import { sessions, users } from '../schema/drizzle/auth.drizzle.schema';
import { roleTypeEnum } from '../schema/drizzle/enum.drizzle.schema';

/**
 * Schema Types
 */
export type UserSchemaType = InferSelectModel<typeof users>;
export type SessionsSchemaType = InferSelectModel<typeof sessions>;

/**
 * Enum Schema Types
 */
export type RoleTypeEnum = (typeof roleTypeEnum.enumValues)[number];
