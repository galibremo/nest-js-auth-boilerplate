import { Injectable } from '@nestjs/common';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';

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

@Injectable()
export class AuthService {
  constructor(
    private readonly betterAuth: BetterAuthService<AuthInstance>,
  ) {}

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
}
