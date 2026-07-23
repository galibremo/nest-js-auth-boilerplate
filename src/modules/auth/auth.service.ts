import { forwardRef, Inject, Injectable } from '@nestjs/common';
import 'multer';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import {
  badRequestError,
  conflictError,
  DomainError,
  notFoundError,
} from '../../core/errors/domain-error';
import { throwBetterAuthError } from './auth.error';
import { AuthInstance } from './auth.factory';
import type {
  LoginInput,
  LoginUser,
  LoginUserData,
} from './schemas/login.schema';
import { BetterAuthLoginResponseSchema } from './schemas/login.schema';
import type { LogoutData } from './schemas/logout.schema';
import { LogoutDataSchema } from './schemas/logout.schema';
import type {
  ChangePasswordInput,
  SetPasswordInput,
} from './schemas/password.schema';
import { BetterAuthSetPasswordResponseSchema } from './schemas/password.schema';
import type { RegisterInput } from './schemas/register.schema';
import { SessionsRepository } from '../sessions/sessions.repository';
import { AuthRepository } from './auth.repository';
import {
  BetterAuthUpdateUserResponseSchema,
  UpdateProfileInput,
} from './schemas/profile.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly betterAuth: BetterAuthService<AuthInstance>,
    private readonly authRepository: AuthRepository,
    @Inject(forwardRef(() => SessionsRepository))
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async getSession(requestHeaders: IncomingHttpHeaders): Promise<LoginUser> {
    try {
      const session = await this.betterAuth.api.getSession({
        headers: fromNodeHeaders(requestHeaders),
      });

      if (!session?.user) {
        throw badRequestError('session_not_found');
      }

      return await this.toLoginUser(session.user);
    } catch (error) {
      throwBetterAuthError(error);
    }
  }

  async logout(requestHeaders: IncomingHttpHeaders): Promise<LogoutData> {
    try {
      const { response, headers } = await this.betterAuth.api.signOut({
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      return LogoutDataSchema.parse({
        success: response.success,
        cookies: headers.getSetCookie(),
      });
    } catch (error) {
      throwBetterAuthError(error);
    }
  }

  async login(
    input: LoginInput,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<LoginUserData> {
    try {
      const { response, headers } = await this.betterAuth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
        },
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      const cookies = headers.getSetCookie();
      const { user } = BetterAuthLoginResponseSchema.parse(response);

      return { user, cookies };
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  async register(
    input: RegisterInput,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<LoginUserData> {
    const existingUser = await this.authRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw conflictError(
        'email_already_exists',
        'A user with this email already exists.',
      );
    }

    try {
      const { response, headers } = await this.betterAuth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      const cookies = headers.getSetCookie();
      const { user } = BetterAuthLoginResponseSchema.parse(response);

      return { user, cookies };
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  async googleSignIn(
    idToken: string,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<LoginUserData> {
    try {
      const { response, headers } = await this.betterAuth.api.signInSocial({
        body: {
          provider: 'google',
          idToken: {
            token: idToken,
          },
        },
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      const cookies = headers.getSetCookie();
      const { user } = BetterAuthLoginResponseSchema.parse(response);

      return { user, cookies };
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  async setUserPassword(
    input: SetPasswordInput,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<boolean> {
    try {
      const data = await this.betterAuth.api.setPassword({
        body: input,
        headers: fromNodeHeaders(requestHeaders),
      });

      return BetterAuthSetPasswordResponseSchema.parse(data).status;
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  async changeUserPassword(
    input: ChangePasswordInput,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<LoginUser> {
    try {
      const data = await this.betterAuth.api.changePassword({
        body: input,
        headers: fromNodeHeaders(requestHeaders),
      });

      const { user } = BetterAuthLoginResponseSchema.parse(data);

      return user;
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  async toLoginUser(sessionUser: { id: string | number }): Promise<LoginUser> {
    const hasPassword = await this.authRepository.hasCredentialAccount(
      Number(sessionUser.id),
    );

    return BetterAuthLoginResponseSchema.parse({
      user: {
        ...sessionUser,
        hasPassword,
      },
    }).user;
  }

  async revokeSession(
    sessionId: string,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<{ status: boolean; cookies: string[] }> {
    try {
      const session =
        await this.sessionsRepository.findSessionByPublicId(sessionId);

      if (!session || session.revokedAt) {
        throw notFoundError('session_not_found', 'Session not found');
      }

      const current = await this.betterAuth.api.getSession({
        headers: fromNodeHeaders(requestHeaders),
      });

      if (!current?.user || Number(current.user.id) !== session.userId) {
        throw notFoundError('session_not_found', 'Session not found');
      }

      const isCurrent = current.session.token === session.token;
      await this.sessionsRepository.softRevokeSessionById(session.id);

      let cookies: string[] = [];
      if (isCurrent) {
        cookies = await this.clearSessionCookies(requestHeaders);
      }

      return { status: true, cookies };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throwBetterAuthError(error);
    }
  }

  async revokeOtherSessions(
    requestHeaders: IncomingHttpHeaders,
  ): Promise<{ status: boolean; cookies: string[] }> {
    try {
      const current = await this.betterAuth.api.getSession({
        headers: fromNodeHeaders(requestHeaders),
      });

      if (!current?.user || !current.session) {
        throw badRequestError('session_not_found');
      }

      await this.sessionsRepository.softRevokeOtherSessions(
        Number(current.user.id),
        Number(current.session.id),
      );

      return { status: true, cookies: [] };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throwBetterAuthError(error);
    }
  }

  async updateProfile(
    input: UpdateProfileInput,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<LoginUserData> {
    try {
      const { response, headers } = await this.betterAuth.api.updateUser({
        body: {
          name: input.name,
        },
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      BetterAuthUpdateUserResponseSchema.parse(response);

      const sessionUser = await this.getSession(requestHeaders);

      return {
        user: {
          ...sessionUser,
          name: input.name,
        },
        cookies: headers.getSetCookie(),
      };
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  private async clearSessionCookies(
    requestHeaders: IncomingHttpHeaders,
  ): Promise<string[]> {
    try {
      const { headers } = await this.betterAuth.api.signOut({
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      return headers.getSetCookie();
    } catch {
      return [];
    }
  }
}
