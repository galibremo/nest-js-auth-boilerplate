import { z } from 'zod';
import { validateEnum, validateString, validateUrl } from './common.schema';

const AllSecretsEnvSchema = z.object({
  BETTER_AUTH_SECRET: validateString('BETTER_AUTH_SECRET', { min: 32 }),
  CRYPTO_SECRET: validateString('CRYPTO_SECRET'),
});

export const CookieEnvSchema = z.object({
  COOKIE_DOMAIN: validateString('COOKIE_DOMAIN'),
  COOKIE_SAME_SITE: validateEnum('COOKIE_SAME_SITE', [
    'strict',
    'lax',
    'none',
  ]).default('lax'),
  COOKIE_SECURE: validateEnum('COOKIE_SECURE', ['true', 'false']).default(
    'false',
  ),
});

const CoreEnvSchema = z.object({
  DATABASE_URL: validateString('DATABASE_URL'),
  PORT: validateString('PORT')
    .refine((value) => !isNaN(Number(value)), 'PORT must be a number')
    .transform((value) => Number(value)),
  NODE_ENV: validateEnum('NODE_ENV', ['development', 'production']).default(
    'development',
  ),
  ORIGIN_URL: validateString('ORIGIN_URL'),
  APP_NAME: validateString('APP_NAME'),
  BETTER_AUTH_URL: validateUrl('BETTER_AUTH_URL'),
});

const GoogleEnvSchema = z.object({
  GOOGLE_CLIENT_ID: validateString('GOOGLE_CLIENT_ID').optional(),
  GOOGLE_CLIENT_SECRET: validateString('GOOGLE_CLIENT_SECRET').optional(),
});

const S3EnvSchema = z.object({
  S3_REGION: validateString('S3_REGION'),
  S3_BUCKET: validateString('S3_BUCKET'),
  S3_ACCESS_KEY_ID: validateString('S3_ACCESS_KEY_ID'),
  S3_SECRET_ACCESS_KEY: validateString('S3_SECRET_ACCESS_KEY'),
  S3_ENDPOINT: validateString('S3_ENDPOINT').optional(),
});

const schemas = [
  CoreEnvSchema,
  CookieEnvSchema,
  AllSecretsEnvSchema,
  GoogleEnvSchema,
  S3EnvSchema,
];

const seenKeys = new Set<string>();
for (const schema of schemas) {
  for (const key of Object.keys(schema.shape)) {
    if (seenKeys.has(key)) {
      throw new Error(`Duplicate env schema key: ${key}`);
    }
    seenKeys.add(key);
  }
}

export const EnvSchema = z
  .object({
    ...CoreEnvSchema.shape,
    ...CookieEnvSchema.shape,
    ...AllSecretsEnvSchema.shape,
    ...GoogleEnvSchema.shape,
    ...S3EnvSchema.shape,
  })
  .superRefine((data, ctx) => {
    if (data.GOOGLE_CLIENT_ID || data.GOOGLE_CLIENT_SECRET) {
      if (!data.GOOGLE_CLIENT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is provided',
          path: ['GOOGLE_CLIENT_ID'],
        });
      }
      if (!data.GOOGLE_CLIENT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is provided',
          path: ['GOOGLE_CLIENT_SECRET'],
        });
      }
    }
  });

export type EnvType = z.infer<typeof EnvSchema>;

// NestJS ConfigModule validation function
export function validateEnv(config: Record<string, unknown>): EnvType {
  const result = EnvSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues.map((e) => e.message).join('\n');
    console.error(
      `\x1b[31mEnvironment validation failed:\n${errorMessages}\x1b[0m`,
    );
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return result.data;
}
