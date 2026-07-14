import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateEmail,
  validatePassword,
  validateString,
} from '../../../core/validators/common.schema';
import { LoginUserSchema } from './login.schema';

export const RegisterInputSchema = z.strictObject({
  name: validateString('Name', { min: 1, max: 100 }),
  email: validateEmail.transform((email) => email.toLowerCase()),
  password: validatePassword.transform((password) => password.trim()),
});

export const RegisterResponseSchema = createApiResponseSchema(LoginUserSchema);

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
