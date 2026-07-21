import { RoleTypeEnum } from 'src/core/database/drizzle/drizzle.types';

export type SessionStatus = 'active' | 'revoked' | 'expired';
export type SessionSortKey =
  'ipAddress' | 'userAgent' | 'createdAt' | 'expiresAt';

export interface SessionRow {
  id: number;
  publicId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: number;
  userRole: RoleTypeEnum;
  loginMethod: string | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: string[];
  deviceType?: string[];
  fromDate?: Date;
  toDate?: Date;
  sort?: string;
  dir?: 'asc' | 'desc';
}
