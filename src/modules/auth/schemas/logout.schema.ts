import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateArray,
  validateBoolean,
  validateString,
} from '../../../core/validators/common.schema';

export const BetterAuthLogoutResponseSchema = z.object({
  success: validateBoolean('Logout success'),
});

export const LogoutDataSchema = BetterAuthLogoutResponseSchema.extend({
  cookies: validateArray('Cookies', validateString('Cookie')),
});

export const LogoutResponseSchema = createApiResponseSchema(
  validateBoolean('Logout success'),
);

export type LogoutData = z.infer<typeof LogoutDataSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
