import type { EmailProviderSchemaType } from '../../core/database/drizzle/drizzle.types';
import { canonicalizeEmailProviderType } from './email-provider.interface';
import type { EmailProviderResponse } from './schemas/email-providers.schema';

const SENSITIVE_FIELDS = [
  'apiKey',
  'apiToken',
  'token',
  'serverToken',
  'secretAccessKey',
  'secretKey',
  'sessionToken',
  'pass',
  'headers',
] as const;
const MASKED_VALUE = '********';

export function mapToResponse(
  provider: EmailProviderSchemaType,
): EmailProviderResponse {
  const config: Record<string, unknown> =
    typeof provider.config === 'string'
      ? (JSON.parse(provider.config) as Record<string, unknown>)
      : provider.config;

  return {
    id: provider.publicId,
    name: provider.name,
    providerType:
      canonicalizeEmailProviderType(provider.providerType) ?? 'email',
    config: maskConfig(config),
    isDefault: provider.isDefault,
    isActive: provider.isActive,
    lastTestedAt: provider.lastTestedAt?.toISOString() ?? null,
    lastTestStatus: provider.lastTestStatus ?? null,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}

export function maskConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const masked = { ...config };

  for (const field of SENSITIVE_FIELDS) {
    if (field in masked) {
      masked[field] = MASKED_VALUE;
    }
  }

  if (
    masked.auth &&
    typeof masked.auth === 'object' &&
    'pass' in (masked.auth as Record<string, unknown>)
  ) {
    masked.auth = {
      ...(masked.auth as Record<string, unknown>),
      pass: MASKED_VALUE,
    };
  }

  return masked;
}
