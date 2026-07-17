import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  baseQuerySchema,
  type SortableField,
} from '../../../core/validators/base-query.schema';
import {
  validateArray,
  validateBoolean,
  validateDate,
  validateEmail,
  validateEnum,
  validateNumber,
  validatePassword,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';
import { roleTypeEnum } from 'src/core/database/schema/drizzle/enum.drizzle.schema';

export const userRoleValues = roleTypeEnum.enumValues;

const USER_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'email', queryName: 'email' },
  { name: 'emailVerified', queryName: 'emailVerified' },
  { name: 'activeSessionCount', queryName: 'activeSessionCount' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
] as const;

const firstQueryValue = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

const booleanQuerySchema = (name: string) =>
  z
    .preprocess(
      (value) => {
        const rawValue = firstQueryValue(value);
        if (typeof rawValue !== 'string') return undefined;

        const normalized = rawValue.trim().toLowerCase();
        return normalized || undefined;
      },
      validateEnum(name, ['true', 'false']).optional(),
    )
    .transform((value) => (value === undefined ? undefined : value === 'true'));

export const UsersListQuerySchema = baseQuerySchema(
  USER_SORTABLE_FIELDS,
).safeExtend({
  emailVerified: booleanQuerySchema('Email Verified'),
});

const optionalNullableString = (name: string, max = 255) =>
  z.preprocess((value) => {
    if (value === null) return null;
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    return trimmed || null;
  }, validateString(name, { max }).nullable().optional());

const optionalNullablePassword = z.preprocess((value) => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed || null;
}, validatePassword.nullable().optional());

export const UpdateUserRoleSchema = z
  .object({
    role: validateEnum('Role', userRoleValues),
  })
  .strict();

export const CreateUserSchema = z
  .object({
    name: optionalNullableString('Name'),
    email: validateEmail.transform((value) => value.toLowerCase()),
    password: optionalNullablePassword,
    emailVerified: validateBoolean('Email Verified').optional(),
  })
  .strict();

export const UpdateUserSchema = z
  .object({
    name: optionalNullableString('Name'),
    email: validateEmail.transform((value) => value.toLowerCase()).optional(),
    emailVerified: validateBoolean('Email Verified').optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one user field must be provided',
  });

export const UserManagementResponseSchema = z.object({
  id: validateUUID('User ID'),
  name: validateString('Name').nullable(),
  email: validateEmail,
  image: validateString('Image').nullable(),
  emailVerified: validateBoolean('Email Verified'),
  role: validateEnum('Role', ['USER', 'SUPER_ADMIN']),
  activeSessionCount: validateNumber('Active Session Count', {
    min: 0,
    int: true,
  }),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const UserListResponseSchema = z.object({
  rows: validateArray('Users', UserManagementResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const DeleteUserResponseSchema = z.object({
  deleted: validateBoolean('Deleted'),
});

export const RevokeUserSessionsResponseSchema = z.object({
  revokedCount: validateNumber('Revoked Count', { min: 0, int: true }),
});

export const UserManagementApiResponseSchema = createApiResponseSchema(
  UserManagementResponseSchema,
);
export const UserListApiResponseSchema = createApiResponseSchema(
  UserListResponseSchema,
);
export const DeleteUserApiResponseSchema = createApiResponseSchema(
  DeleteUserResponseSchema,
);
export const RevokeUserSessionsApiResponseSchema = createApiResponseSchema(
  RevokeUserSessionsResponseSchema,
);

export type UsersListQueryDto = z.infer<typeof UsersListQuerySchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;
export type UserManagementResponse = z.infer<
  typeof UserManagementResponseSchema
>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type DeleteUserResponse = z.infer<typeof DeleteUserResponseSchema>;
export type RevokeUserSessionsResponse = z.infer<
  typeof RevokeUserSessionsResponseSchema
>;
export type UserManagementApiResponse = z.infer<
  typeof UserManagementApiResponseSchema
>;
export type UserListApiResponse = z.infer<typeof UserListApiResponseSchema>;
export type DeleteUserApiResponse = z.infer<typeof DeleteUserApiResponseSchema>;
export type RevokeUserSessionsApiResponse = z.infer<
  typeof RevokeUserSessionsApiResponseSchema
>;
