import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';
import { users } from './auth.drizzle.schema';
import {
  workspaceMemberStatusEnum,
  workspaceRoleEnum,
  workspaceStatusEnum,
} from './enum.drizzle.schema';

// =======================
// Tables
// =======================
export const workspaces = pgTable(
  'workspaces',
  {
    id: serial('id').primaryKey(),
    publicId: uuid('public_id').defaultRandom().notNull().unique(),
    name: text('name').notNull(),
    status: workspaceStatusEnum('status').default('ACTIVE').notNull(),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('workspaces_owner_id_idx').on(table.ownerId),
    index('workspaces_status_idx').on(table.status),
    index('workspaces_deleted_at_idx').on(table.deletedAt),
  ],
);

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: serial('id').primaryKey(),
    publicId: uuid('public_id').defaultRandom().notNull().unique(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceRoleEnum('role').default('MEMBER').notNull(),
    status: workspaceMemberStatusEnum('status').default('ACTIVE').notNull(),
    ...timestamps,
  },
  (table) => [
    index('workspace_members_workspace_id_idx').on(table.workspaceId),
    index('workspace_members_user_id_idx').on(table.userId),
    index('workspace_members_role_idx').on(table.role),
    index('workspace_members_status_idx').on(table.status),
    uniqueIndex('workspace_members_workspace_user_uidx').on(
      table.workspaceId,
      table.userId,
    ),
  ],
);
