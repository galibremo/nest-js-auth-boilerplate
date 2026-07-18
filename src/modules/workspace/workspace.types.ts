import type {
  WorkspaceMemberStatusEnum,
  WorkspaceRoleEnum,
  WorkspaceSchemaType,
} from '../../core/database/drizzle/drizzle.types';

export type WorkspaceManagementRow = Pick<
  WorkspaceSchemaType,
  | 'id'
  | 'publicId'
  | 'name'
  | 'status'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
> & {
  memberCount: number;
  ownerId: number | null;
  ownerPublicId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export type WorkspaceMemberRow = {
  userId: number;
  userPublicId: string;
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  role: WorkspaceRoleEnum;
  status: WorkspaceMemberStatusEnum;
  workspaceOwnerId: number | null;
};
