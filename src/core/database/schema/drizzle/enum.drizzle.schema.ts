import { pgEnum } from 'drizzle-orm/pg-core';

export const roleTypeEnum = pgEnum('role_type', ['USER', 'SUPER_ADMIN']);
