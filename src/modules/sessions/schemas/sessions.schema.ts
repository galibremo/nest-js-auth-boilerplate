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
  validateEnum,
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

const SESSION_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'ipAddress', queryName: 'ipAddress' },
  { name: 'userAgent', queryName: 'userAgent' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'expiresAt', queryName: 'expiresAt' },
] as const;

const SESSION_STATUS_VALUES = ['active', 'revoked', 'expired'] as const;

const StatusQuerySchema = validateString('Status')
  .transform((value) =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .refine(
    (values) =>
      values.every((status) =>
        SESSION_STATUS_VALUES.includes(
          status as (typeof SESSION_STATUS_VALUES)[number],
        ),
      ),
    {
      message: 'Status is invalid',
    },
  )
  .optional();

export const SessionsListQuerySchema = baseQuerySchema(
  SESSION_SORTABLE_FIELDS,
).and(
  z.object({
    status: StatusQuerySchema,
    deviceType: validateString('Device Type').optional(),
  }),
);

export const SessionResponseSchema = z.object({
  id: validateUUID('Session ID'),
  deviceName: validateString('Device Name'),
  deviceType: validateString('Device Type'),
  ipAddress: validateString('IP Address').nullable(),
  userAgent: validateString('User Agent').nullable(),
  loginMethod: validateString('Login Method').nullable(),
  status: validateEnum('Status', ['active', 'expired']),
  isCurrent: validateBoolean('Is Current'),
  isRevoked: validateBoolean('Is Revoked'),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
  expiresAt: validateDate('Expires At'),
});

export const SessionListResponseSchema = z.object({
  rows: validateArray('Sessions', SessionResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
  activeOtherSessionCount: validateNumber('Active Other Session Count', {
    min: 0,
    int: true,
  }),
});

export const RevokeSessionResponseSchema = z.object({
  revoked: validateBoolean('Revoked'),
});

export const RevokeOtherSessionsResponseSchema = z.object({
  revokedCount: validateNumber('Revoked Count', { min: 0, int: true }),
});

export const DeleteSessionResponseSchema = z.object({
  deleted: validateBoolean('Deleted'),
});

export const SessionListApiResponseSchema = createApiResponseSchema(
  SessionListResponseSchema,
);
export const RevokeSessionApiResponseSchema = createApiResponseSchema(
  RevokeSessionResponseSchema,
);
export const RevokeOtherSessionsApiResponseSchema = createApiResponseSchema(
  RevokeOtherSessionsResponseSchema,
);

export const DeleteSessionApiResponseSchema = createApiResponseSchema(
  DeleteSessionResponseSchema,
);

export type SessionsListQueryDto = z.infer<typeof SessionsListQuerySchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;
export type SessionListApiResponse = z.infer<
  typeof SessionListApiResponseSchema
>;
export type RevokeSessionApiResponse = z.infer<
  typeof RevokeSessionApiResponseSchema
>;
export type RevokeOtherSessionsApiResponse = z.infer<
  typeof RevokeOtherSessionsApiResponseSchema
>;
export type DeleteSessionApiResponse = z.infer<
  typeof DeleteSessionApiResponseSchema
>;
