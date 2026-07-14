import { z } from 'zod';

import {
  validateBoolean,
  validateNumber,
  validateString,
  validateUnion,
} from './common.schema';

export const PaginationSchema = z.object({
  totalItems: validateNumber('Total Items', { min: 0, int: true }),
  limit: validateNumber('Limit', { min: 0, int: true }),
  offset: validateNumber('Offset', { min: 0, int: true }),
  currentPage: validateNumber('Current Page', { min: 0, int: true }),
  totalPages: validateNumber('Total Pages', { min: 0, int: true }),
  hasPrevPage: validateBoolean('Has Previous Page'),
  hasNextPage: validateBoolean('Has Next Page'),
  prevPage: validateNumber('Previous Page', { min: 0, int: true }).nullable(),
  nextPage: validateNumber('Next Page', { min: 0, int: true }).nullable(),
});

export const CursorPaginationSchema = z.object({
  totalItems: validateNumber('Total Items', { min: 0, int: true }),
  hasMoreBefore: validateBoolean('Has More Before'),
  hasMoreAfter: validateBoolean('Has More After'),
  beforeCursor: validateUnion('Before Cursor', [
    z.string(),
    z.number(),
  ]).nullable(),
  afterCursor: validateUnion('After Cursor', [
    z.string(),
    z.number(),
  ]).nullable(),
  count: validateNumber('Count', { min: 0, int: true }),
});

export const ApiPaginationSchema = validateUnion('Pagination', [
  PaginationSchema,
  CursorPaginationSchema,
]);

export type Pagination = z.infer<typeof PaginationSchema>;
export type CursorPagination = z.infer<typeof CursorPaginationSchema>;
export type ApiPagination = z.infer<typeof ApiPaginationSchema>;

export function createApiResponseSchema<TData extends z.ZodType>(
  dataSchema: TData,
) {
  return z.object({
    statusCode: validateNumber('Status Code', { min: 100, int: true }),
    message: validateString('Message'),
    data: dataSchema.optional(),
    timestamp: validateString('Timestamp').refine(
      (value) => !Number.isNaN(Date.parse(value)),
      'Timestamp must be a valid ISO date-time',
    ),
    path: validateString('Path'),
    pagination: ApiPaginationSchema.optional(),
  });
}
