import { pgEnum } from 'drizzle-orm/pg-core';

// =======================
// Enums
// =======================
export const roleTypeEnum = pgEnum('role_type', ['USER', 'SUPER_ADMIN']);

// =======================
// Enums
// =======================
export const workspaceRoleEnum = pgEnum('workspace_role', ['OWNER', 'MEMBER']);
export const workspaceMemberStatusEnum = pgEnum('workspace_member_status', [
  'ACTIVE',
  'INACTIVE',
  'INVITED',
]);
export const workspaceStatusEnum = pgEnum('workspace_status', [
  'ACTIVE',
  'INACTIVE',
]);
// export const workspaceInvitationStatusEnum = pgEnum(
//   'workspace_invitation_status',
//   ['PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED'],
// );
