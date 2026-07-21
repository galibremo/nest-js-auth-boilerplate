import {
  boolean,
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
import { roleTypeEnum } from './enum.drizzle.schema';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    publicId: uuid('public_id').defaultRandom().notNull().unique(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    lastLoginMethod: text('last_login_method'),
    image: text('image'),
    role: roleTypeEnum('role').default('USER').notNull(),
    ...timestamps,
  },
  (table) => [index('users_email_verified_idx').on(table.emailVerified)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    publicId: uuid('public_id').defaultRandom().notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    loginMethod: text('login_method'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    impersonatedBy: text('impersonated_by'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: serial('id').primaryKey(),
    publicId: uuid('public_id').defaultRandom().notNull().unique(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('accounts_provider_account_idx').on(
      table.providerId,
      table.accountId,
    ),
    index('accounts_user_id_idx').on(table.userId),
  ],
);

export const verifications = pgTable(
  'verifications',
  {
    id: serial('id').primaryKey(),
    publicId: uuid('public_id').defaultRandom().notNull().unique(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index('verifications_identifier_idx').on(table.identifier),
    index('verifications_expires_at_idx').on(table.expiresAt),
  ],
);
