import type { UserManagementResponse } from './schemas/users.schema';

export type UserSortKey =
  'name' | 'email' | 'emailVerified' | 'createdAt' | 'updatedAt';

export type UserSortDirection = 'asc' | 'desc';

export interface UserManagementRow {
  id: number;
  publicId: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  role: 'USER' | 'SUPER_ADMIN';
  activeSessionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type { UserManagementResponse };
