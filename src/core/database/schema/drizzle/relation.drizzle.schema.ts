import { relations } from 'drizzle-orm';
import { users } from './auth.drizzle.schema';
export const usersRelations = relations(users, () => ({}));

