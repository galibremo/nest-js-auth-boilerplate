import { z } from 'zod';

import {
  baseQuerySchema,
  SortableField,
} from 'src/core/validators/base-query.schema';
import { validateString } from 'src/core/validators/common.schema';

export const workspaceStatusValues = ['ACTIVE', 'INACTIVE'] as const;

const WORKSPACE_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'status', queryName: 'status' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
] as const;

const statusQuerySchema = validateString('Status')
  .transform((value) =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .refine(
    (values) =>
      values.every((s) =>
        (workspaceStatusValues as readonly string[]).includes(s),
      ),
    { message: 'Status is invalid' },
  )
  .transform((values) => values as (typeof workspaceStatusValues)[number][])
  .optional();

export const WorkspaceListQuerySchema = baseQuerySchema(
  WORKSPACE_SORTABLE_FIELDS,
).safeExtend({
  status: statusQuerySchema,
});

export type WorkspaceListQueryDto = z.infer<typeof WorkspaceListQuerySchema>;
