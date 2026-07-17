import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateArray,
  validateBoolean,
  validateDate,
  validateEmail,
  validateEnum,
  validatePositiveInteger,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

export const LoginInputSchema = z.strictObject({
  email: validateEmail.transform((email) => email.toLowerCase()),
  password: validateString('Password').transform((password) => password.trim()),
});

export const LoginUserSchema = z
  .object({
    id: validateString('ID').or(validatePositiveInteger('ID')),
    publicId: validateUUID('Public ID'),
    name: validateString('Name'),
    email: validateEmail,
    emailVerified: validateBoolean('Email verified'),
    role: validateEnum('Role', ['USER', 'SUPER_ADMIN']),
    image: validateString('Image').nullable(),
    createdAt: validateDate('Created at'),
    updatedAt: validateDate('Updated at'),
  })
  .transform((user) => ({
    ...user,
    id: user.publicId,
  }));

export const LoginUserDataSchema = z.object({
  user: LoginUserSchema,
  cookies: validateArray('Cookies', validateString('Cookie')),
});

export const BetterAuthLoginResponseSchema = z.object({
  user: LoginUserSchema,
});

export const LoginResponseSchema = createApiResponseSchema(LoginUserSchema);

export type LoginInput = z.infer<typeof LoginInputSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type LoginUserData = z.infer<typeof LoginUserDataSchema>;
