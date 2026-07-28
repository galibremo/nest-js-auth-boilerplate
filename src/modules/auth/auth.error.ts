import { HttpStatus } from '@nestjs/common';
import { isAPIError } from 'better-auth/api';
import { ZodError } from 'zod';

import {
  badRequestError,
  conflictError,
  DomainError,
  type DomainErrorMeta,
  forbiddenError,
  unprocessableError,
} from '../../core/errors/domain-error';

export const invalidCredentialsError = (): DomainError =>
  new DomainError(
    'invalid_credentials',
    'Invalid email or password.',
    HttpStatus.UNAUTHORIZED,
  );

export const emailNotVerifiedError = (): DomainError =>
  new DomainError(
    'email_not_verified',
    'Email address must be verified before signing in.',
    HttpStatus.FORBIDDEN,
  );

export const invalidMagicLinkError = (): DomainError =>
  new DomainError(
    'invalid_magic_link',
    'This magic link is invalid, expired, or has already been used. Please request a new one.',
    HttpStatus.UNAUTHORIZED,
  );

export const rateLimitExceededError = (retryAfter?: string): DomainError =>
  new DomainError(
    'rate_limit_exceeded',
    'Too many login attempts. Please try again later.',
    HttpStatus.TOO_MANY_REQUESTS,
    retryAfter ? { retryAfter } : {},
  );

export const sessionRequiredError = (): DomainError =>
  new DomainError(
    'session_required',
    'A valid authentication session is required.',
    HttpStatus.UNAUTHORIZED,
  );

export const authInternalError = (): DomainError =>
  new DomainError(
    'auth_internal_error',
    'Authentication service failed to process the request.',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );

export const twoFactorRequiredError = (
  message: string,
  meta?: DomainErrorMeta,
): DomainError =>
  new DomainError(
    'two_factor_required',
    message,
    HttpStatus.UNAUTHORIZED,
    meta,
  );

export function throwBetterAuthError(error: unknown): never {
  if (error instanceof DomainError || error instanceof ZodError) {
    throw error;
  }

  if (!isAPIError(error)) {
    throw authInternalError();
  }

  const providerCode = error.body?.code ?? getRedirectErrorCode(error.headers);

  if (providerCode === 'INVALID_TOKEN' && error.status === 'FOUND') {
    throw invalidMagicLinkError();
  }

  switch (error.statusCode) {
    case 400:
      throw badRequestError('Authentication request is invalid.');
    case 401:
      throw invalidCredentialsError();
    case 403:
      if (providerCode === 'EMAIL_NOT_VERIFIED') {
        throw emailNotVerifiedError();
      }

      throw forbiddenError(
        'auth_forbidden',
        'Authentication request is forbidden.',
      );
    case 409:
      throw conflictError(
        'auth_conflict',
        'Authentication request conflicts with existing data.',
      );
    case 422:
      throw unprocessableError(
        'auth_unprocessable',
        'Authentication request could not be processed.',
      );
    case 429:
      throw rateLimitExceededError(
        new Headers(error.headers).get('retry-after') ?? undefined,
      );
    default:
      throw authInternalError();
  }
}

function getRedirectErrorCode(
  headers: HeadersInit | undefined,
): string | undefined {
  const location = new Headers(headers).get('location');

  if (!location) {
    return undefined;
  }

  const queryStart = location.indexOf('?');

  if (queryStart === -1) {
    return undefined;
  }

  const fragmentStart = location.indexOf('#', queryStart + 1);
  const query = location.slice(
    queryStart + 1,
    fragmentStart === -1 ? location.length : fragmentStart,
  );

  return new URLSearchParams(query).get('error') ?? undefined;
}
