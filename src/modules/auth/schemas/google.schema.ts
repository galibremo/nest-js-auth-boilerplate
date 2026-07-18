import { z } from 'zod';

export const GoogleSignInInputSchema = z.strictObject({
  idToken: z.string().min(1, 'Google ID Token is required'),
});

export type GoogleSignInInput = z.infer<typeof GoogleSignInInputSchema>;
