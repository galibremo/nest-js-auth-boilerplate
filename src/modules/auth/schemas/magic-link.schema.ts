import { z } from 'zod';

import {
  validateEmail,
  validateString,
  validateUrl,
} from '../../../core/validators/common.schema';

export const MagicLinkSignInInputSchema = z.strictObject({
  email: validateEmail.transform((email) => email.toLowerCase()),
  name: validateString('Name').optional(),
  url: validateUrl('URL').optional(),
  callbackURL: validateString('Callback URL').optional(),
  newUserCallbackURL: validateString('New user callback URL').optional(),
  errorCallbackURL: validateString('Error callback URL').optional(),
});

export const MagicLinkVerifyQuerySchema = z.strictObject({
  token: validateString('Token'),
  callbackURL: validateString('Callback URL').optional(),
  errorCallbackURL: validateString('Error callback URL').optional(),
  newUserCallbackURL: validateString('New user callback URL').optional(),
});

export type MagicLinkSignInInput = z.infer<typeof MagicLinkSignInInputSchema>;
export type MagicLinkVerifyQuery = z.infer<typeof MagicLinkVerifyQuerySchema>;
