import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import { validateBoolean } from '../../../core/validators/common.schema';

export const RevokeSessionResponseSchema = createApiResponseSchema(validateBoolean('Status'));

export const RevokeOtherSessionsResponseSchema = createApiResponseSchema(validateBoolean('Status'));

export type RevokeSessionResponse = z.infer<typeof RevokeSessionResponseSchema>;
export type RevokeOtherSessionsResponse = z.infer<typeof RevokeOtherSessionsResponseSchema>;
