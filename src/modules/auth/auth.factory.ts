import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import type { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import schema from '../../core/database/drizzle/drizzle.schema';
import type { EnvType } from '../../core/validators/env';
import { lastLoginMethod } from 'better-auth/plugins';

export const BETTER_AUTH_BASE_PATH = '/internal/auth';

type SessionLoginMethodContext = {
  path?: string;
  params?: {
    id?: string;
    providerId?: string;
  };
  body?: {
    provider?: string;
  };
} | null;

function resolveSessionLoginMethod(
  context: SessionLoginMethodContext,
): string | null {
  if (!context?.path) {
    return null;
  }

  const path = context.path;

  if (path.startsWith('/callback/') || path.startsWith('/oauth2/callback/')) {
    return (
      context.params?.id ||
      context.params?.providerId ||
      path.split('/').pop() ||
      null
    );
  }

  if (path === '/sign-in/social') {
    return context.body?.provider || null;
  }

  if (path === '/sign-in/email' || path === '/sign-up/email') {
    return 'email';
  }

  if (path.startsWith('/magic-link/verify')) {
    return 'magic-link';
  }

  return null;
}

export function createAuth(
  database: NodePgDatabase<typeof schema>,
  configService: ConfigService<EnvType, true>,
) {
  const isProduction =
    configService.get('NODE_ENV', { infer: true }) === 'production';
  const secureCookies =
    isProduction ||
    configService.get('COOKIE_SECURE', { infer: true }) === 'true';
  const cookieDomain = configService.get('COOKIE_DOMAIN', { infer: true });

  return betterAuth({
    appName: configService.get('APP_NAME', { infer: true }),
    baseURL: configService.get('BETTER_AUTH_URL', { infer: true }),
    basePath: BETTER_AUTH_BASE_PATH,
    secret: configService.get('BETTER_AUTH_SECRET', { infer: true }),
    trustedOrigins: configService
      .get('ORIGIN_URL', { infer: true })
      .split(',')
      .map((origin) => origin.trim()),
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema,
      usePlural: true,
    }),
    plugins: [
      lastLoginMethod({
        storeInDatabase: true,
      }),
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        clientId: configService.get('GOOGLE_CLIENT_ID', { infer: true }) || '',
        clientSecret:
          configService.get('GOOGLE_CLIENT_SECRET', { infer: true }) || '',
      },
    },
    user: {
      additionalFields: {
        publicId: {
          type: 'string',
          required: false,
          input: false,
        },
        role: {
          type: 'string',
          required: false,
          input: false,
        },
      },
    },
    rateLimit: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
      additionalFields: {
        loginMethod: {
          type: 'string',
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before(session, context) {
            const loginMethod = resolveSessionLoginMethod(context);
            if (!loginMethod) {
              return Promise.resolve();
            }

            return Promise.resolve({
              data: {
                ...session,
                loginMethod,
              },
            });
          },
        },
      },
    },
    advanced: {
      useSecureCookies: secureCookies,
      ipAddress: {
        ipAddressHeaders: ['x-real-ip'],
      },
      database: {
        generateId: 'serial',
      },
      defaultCookieAttributes: {
        httpOnly: true,
        secure: secureCookies,
        sameSite: configService.get('COOKIE_SAME_SITE', { infer: true }),
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
