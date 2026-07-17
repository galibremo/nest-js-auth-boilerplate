import type { UserManagementResponse, UserManagementRow } from './users.types';

export function mapUserManagementResponse(
  row: UserManagementRow,
): UserManagementResponse {
  return {
    id: row.publicId,
    name: row.name,
    email: row.email,
    image: row.image,
    emailVerified: row.emailVerified,
    role: row.role,
    activeSessionCount: Number(row.activeSessionCount ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
