import type { InferSelectModel } from 'drizzle-orm';

import { sessions, users } from '../schema/drizzle/auth.drizzle.schema';
import { roleTypeEnum } from '../schema/drizzle/enum.drizzle.schema';
import { workspaces } from '../schema/drizzle/workspace.drizzle.schema';

/**
 * Schema Types
 */
export type UserSchemaType = InferSelectModel<typeof users>;
export type SessionsSchemaType = InferSelectModel<typeof sessions>;
export type WorkspaceSchemaType = InferSelectModel<typeof workspaces>;

/**
 * Enum Schema Types
 */
export type RoleTypeEnum = (typeof roleTypeEnum.enumValues)[number];
