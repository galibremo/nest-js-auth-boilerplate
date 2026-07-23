import { z } from 'zod';

import { validateBoolean, validateString } from '../../../core/validators/common.schema';
import { LoginResponseSchema, type LoginResponse, type LoginUser } from './login.schema';

export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
export const PROFILE_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const UpdateProfileInputSchema = z.strictObject({
	name: validateString('Name', { min: 1, max: 255 }),
});

/** Better Auth `updateUser` returns `{ status: true }`, not a user payload. */
export const BetterAuthUpdateUserResponseSchema = z.object({
	status: validateBoolean('Update user status'),
});

export const UpdateProfileResponseSchema = LoginResponseSchema;

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
export type UpdateProfileResponse = LoginResponse;
export type UpdateProfileImageResponse = LoginResponse;
export type ProfileUser = LoginUser;
