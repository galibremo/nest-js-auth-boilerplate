import z from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateBoolean,
  validateNewPassword,
  validatePassword,
} from '../../../core/validators/common.schema';
import { LoginUserSchema } from './login.schema';

export const ChangePasswordInputSchema = z.strictObject({
  currentPassword: validatePassword,
  newPassword: validateNewPassword,
});

export const SetPasswordInputSchema = z.strictObject({
  newPassword: validateNewPassword,
});

export const BetterAuthSetPasswordResponseSchema = z.object({
  status: validateBoolean('Password set status'),
});

export const SetPasswordResponseSchema = createApiResponseSchema(
  validateBoolean('Password set status'),
);

export const ChangePasswordResponseSchema =
  createApiResponseSchema(LoginUserSchema);

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;
export type SetPasswordInput = z.infer<typeof SetPasswordInputSchema>;
export type SetPasswordResponse = z.infer<typeof SetPasswordResponseSchema>;
export type ChangePasswordResponse = z.infer<
  typeof ChangePasswordResponseSchema
>;
