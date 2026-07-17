import { Injectable } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';

import {
  conflictError,
  isDatabaseUniqueViolation,
  notFoundError,
} from '../../core/errors/domain-error';
import type {
  CreateUserDto,
  DeleteUserResponse,
  RevokeUserSessionsResponse,
  UpdateUserDto,
  UpdateUserRoleDto,
  UserListResponse,
  UserManagementResponse,
  UsersListQueryDto,
} from './schemas/users.schema';
import { mapUserManagementResponse } from './users.mapper';
import { UsersRepository } from './users.repository';
import { UsersPolicy } from './users.policy';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async listUsers(query: UsersListQueryDto): Promise<UserListResponse> {
    const users = await this.usersRepository.listUsers(query);

    return {
      rows: users.rows.map(mapUserManagementResponse),
      total: users.total,
      page: users.page,
      pageSize: users.pageSize,
    };
  }

  async getUserById(
    currentUser: CurrentUser,
    publicId: string,
  ): Promise<UserManagementResponse> {
    const targetUser = await this.getTargetUser(publicId);
    UsersPolicy.assertCanManageUser(currentUser, targetUser);
    return this.getManagementResponse(targetUser.id);
  }

  async createUser(
    currentUser: CurrentUser,
    data: CreateUserDto,
  ): Promise<UserManagementResponse> {
    UsersPolicy.assertCanAssignRole(currentUser);
    await this.assertEmailAvailable(data.email);

    const passwordHash = data.password
      ? await hashPassword(data.password)
      : null;

    try {
      const createdUser = await this.usersRepository.createUser({
        name: this.getPersistedName(data.name, data.email),
        email: data.email,
        emailVerified: data.emailVerified ?? false,
        role: 'USER',
      });

      if (!createdUser) throw notFoundError('user_not_found', 'User not found');

      if (passwordHash) {
        await this.usersRepository.createCredentialAccount({
          userId: createdUser.id,
          passwordHash,
        });
      }

      return this.getManagementResponse(createdUser.id);
    } catch (error) {
      this.throwEmailConflictIfUniqueViolation(error);
      throw error;
    }
  }

  async updateUser(
    currentUser: CurrentUser,
    publicId: string,
    data: UpdateUserDto,
  ): Promise<UserManagementResponse> {
    const targetUser = await this.getTargetUser(publicId);

    UsersPolicy.assertCanManageUser(currentUser, targetUser);

    if (data.email && data.email !== targetUser.email) {
      await this.assertEmailAvailable(data.email, targetUser.id);
    }

    try {
      await this.usersRepository.updateUser(targetUser.id, {
        ...(Object.prototype.hasOwnProperty.call(data, 'name')
          ? { name: this.getPersistedName(data.name, targetUser.email) }
          : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(typeof data.emailVerified === 'boolean'
          ? { emailVerified: data.emailVerified }
          : {}),
      });

      return this.getManagementResponse(targetUser.id);
    } catch (error) {
      this.throwEmailConflictIfUniqueViolation(error);
      throw error;
    }
  }

  async updateUserRole(
    currentUser: CurrentUser,
    publicId: string,
    data: UpdateUserRoleDto,
  ): Promise<UserManagementResponse> {
    const targetUser = await this.getTargetUser(publicId);

    UsersPolicy.assertCanManageUser(currentUser, targetUser);
    UsersPolicy.assertCanAssignRole(currentUser);

    if (targetUser.role !== data.role) {
      await this.usersRepository.updateUserRole(targetUser.id, data.role);
    }

    const user = await this.getManagementResponse(targetUser.id);

    return user;
  }

  async deleteUser(
    currentUser: CurrentUser,
    publicId: string,
  ): Promise<DeleteUserResponse> {
    const targetUser = await this.getTargetUser(publicId);

    UsersPolicy.assertCanManageUser(currentUser, targetUser);
    const deletedUser = await this.usersRepository.deleteUser(targetUser.id);
    if (!deletedUser) throw notFoundError('user_not_found', 'User not found');

    return { deleted: true };
  }

  async revokeUserSessions(
    currentUser: CurrentUser,
    publicId: string,
  ): Promise<RevokeUserSessionsResponse> {
    const targetUser = await this.getTargetUser(publicId);
    UsersPolicy.assertCanManageUser(currentUser, targetUser);
    const revokedCount = await this.usersRepository.revokeUserSessions(
      targetUser.id,
    );

    return { revokedCount };
  }

  private async getTargetUser(publicId: string) {
    const targetUser = await this.usersRepository.findUserByPublicId(publicId);

    if (!targetUser) throw notFoundError('user_not_found', 'User not found');

    return targetUser;
  }

  private async getManagementResponse(
    userId: number,
  ): Promise<UserManagementResponse> {
    const user = await this.usersRepository.findUserManagementRowById(userId);
    if (!user) throw notFoundError('user_not_found', 'User not found');

    return mapUserManagementResponse(user);
  }

  private async assertEmailAvailable(
    email: string,
    excludedUserId?: number,
  ): Promise<void> {
    const existingUser = await this.usersRepository.findUserByEmail(email);

    if (existingUser && existingUser.id !== excludedUserId) {
      throw conflictError(
        'email_already_exists',
        'A user with this email already exists.',
      );
    }
  }

  private throwEmailConflictIfUniqueViolation(error: unknown): void {
    if (isDatabaseUniqueViolation(error)) {
      throw conflictError(
        'email_already_exists',
        'A user with this email already exists.',
      );
    }
  }

  private getPersistedName(
    name: string | null | undefined,
    email: string,
  ): string {
    const trimmedName = name?.trim();
    if (trimmedName) return trimmedName;

    return email.split('@')[0] ?? email;
  }
}
