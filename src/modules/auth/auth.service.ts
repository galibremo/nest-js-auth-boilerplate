import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import 'multer';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import sharp from 'sharp';
import { MediaService } from '../media/media.service';
import { StorageService } from '../../core/storage/storage.service';
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
  MagicLinkSignInInput,
  MagicLinkVerifyQuery,
} from './schemas/magic-link.schema';
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
  MAX_PROFILE_IMAGE_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
} from './schemas/profile.schema';

const PROFILE_IMAGE_MAX_DIMENSION = 256;
const PROFILE_IMAGE_WEBP_QUALITY = 80;
const REMOTE_PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly betterAuth: BetterAuthService<AuthInstance>,
    private readonly authRepository: AuthRepository,
    @Inject(forwardRef(() => SessionsRepository))
    private readonly sessionsRepository: SessionsRepository,
    private readonly mediaService: MediaService,
    private readonly storageService: StorageService,
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
      const { user: parsedUser } =
        BetterAuthLoginResponseSchema.parse(response);

      const user = await this.toLoginUser(parsedUser);
      const synced = await this.syncExternalProfileImage(
        user,
        requestHeaders,
        cookies,
      );

      return {
        user: synced.user,
        cookies: [...cookies, ...synced.cookies],
      };
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  async magicLinkSignIn(
    input: MagicLinkSignInInput,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<boolean> {
    try {
      const metadata: Record<string, unknown> = {};
      if (input.url) metadata.url = input.url;
      if (input.callbackURL) metadata.callbackURL = input.callbackURL;
      if (input.newUserCallbackURL) {
        metadata.newUserCallbackURL = input.newUserCallbackURL;
      }

      const data = await this.betterAuth.api.signInMagicLink({
        body: {
          email: input.email,
          ...(input.name ? { name: input.name } : {}),
          ...(input.callbackURL ? { callbackURL: input.callbackURL } : {}),
          ...(input.newUserCallbackURL
            ? { newUserCallbackURL: input.newUserCallbackURL }
            : {}),
          ...(input.errorCallbackURL
            ? { errorCallbackURL: input.errorCallbackURL }
            : {}),
          ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
        },
        headers: fromNodeHeaders(requestHeaders),
      });

      return data.status;
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  async magicLinkVerify(
    data: MagicLinkVerifyQuery,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<LoginUserData> {
    try {
      const { response, headers } = await this.betterAuth.api.magicLinkVerify({
        query: {
          token: data.token,
        },
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      const user = await this.toLoginUser(response.user);

      return { user, cookies: headers.getSetCookie() };
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
  ): Promise<boolean> {
    try {
      await this.betterAuth.api.changePassword({
        body: input,
        headers: fromNodeHeaders(requestHeaders),
      });

      return true;
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

  async updateProfileImage(
    actor: CurrentUser,
    file: Express.Multer.File,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<LoginUserData> {
    this.assertValidProfileImage(file);

    const previousImage = actor.image ?? null;
    const optimizedFile = await this.optimizeProfileImage(file);
    const { publicUrl } = await this.mediaService.uploadProfileImage(
      actor,
      optimizedFile,
    );

    try {
      const { response, headers } = await this.betterAuth.api.updateUser({
        body: {
          image: publicUrl,
        },
        headers: fromNodeHeaders(requestHeaders),
        returnHeaders: true,
      });

      BetterAuthUpdateUserResponseSchema.parse(response);

      const sessionUser = await this.getSession(requestHeaders);

      await this.deletePreviousProfileImage(previousImage);

      return {
        user: {
          ...sessionUser,
          image: publicUrl,
        },
        cookies: headers.getSetCookie(),
      };
    } catch (error: unknown) {
      throwBetterAuthError(error);
    }
  }

  private assertValidProfileImage(file: Express.Multer.File): void {
    if (!file) {
      throw badRequestError('Profile image is required.');
    }

    const mimeType = file.mimetype as (typeof PROFILE_IMAGE_MIME_TYPES)[number];
    if (!PROFILE_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw badRequestError('Profile image must be a PNG, JPG, or WEBP file.');
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      throw badRequestError('Profile image must be smaller than 2MB.');
    }
  }

  private async optimizeProfileImage(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    const buffer = await this.optimizeProfileImageBuffer(file.buffer);

    return {
      ...file,
      buffer,
      size: buffer.length,
      mimetype: 'image/webp',
      originalname: 'avatar.webp',
    };
  }

  private async optimizeProfileImageBuffer(input: Buffer): Promise<Buffer> {
    try {
      return await sharp(input)
        .rotate()
        .resize(PROFILE_IMAGE_MAX_DIMENSION, PROFILE_IMAGE_MAX_DIMENSION, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .webp({ quality: PROFILE_IMAGE_WEBP_QUALITY })
        .toBuffer();
    } catch (error) {
      this.logger.error('Failed to optimize profile image', error);
      throw badRequestError(
        'Profile image could not be processed. Choose a valid image file.',
      );
    }
  }

  private async syncExternalProfileImage(
    user: LoginUser,
    requestHeaders: IncomingHttpHeaders,
    sessionCookies: string[],
  ): Promise<{ user: LoginUser; cookies: string[] }> {
    if (!user.image || this.tryExtractProfilesObjectKey(user.image)) {
      return { user, cookies: [] };
    }

    try {
      const remoteBuffer = await this.downloadRemoteImage(user.image);
      const optimizedBuffer =
        await this.optimizeProfileImageBuffer(remoteBuffer);
      const { publicUrl } =
        await this.mediaService.storeProfileWebp(optimizedBuffer);

      const { response, headers } = await this.betterAuth.api.updateUser({
        body: {
          image: publicUrl,
        },
        headers: this.mergeSessionCookies(requestHeaders, sessionCookies),
        returnHeaders: true,
      });

      BetterAuthUpdateUserResponseSchema.parse(response);

      return {
        user: {
          ...user,
          image: publicUrl,
        },
        cookies: headers.getSetCookie(),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to persist external profile image for user ${user.id}; keeping provider URL`,
        error,
      );
      return { user, cookies: [] };
    }
  }

  private async downloadRemoteImage(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Remote image download failed with status ${response.status}`,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new Error(
        `Remote URL did not return an image (content-type: ${contentType || 'unknown'})`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0) {
      throw new Error('Remote image download returned an empty body');
    }
    if (buffer.byteLength > REMOTE_PROFILE_IMAGE_MAX_BYTES) {
      throw new Error('Remote image exceeds the maximum allowed download size');
    }

    return buffer;
  }

  private mergeSessionCookies(
    requestHeaders: IncomingHttpHeaders,
    setCookies: string[],
  ): Headers {
    const headers = fromNodeHeaders(requestHeaders);
    const cookiePairs = setCookies
      .map((cookie) => cookie.split(';')[0]?.trim())
      .filter((pair): pair is string => Boolean(pair));

    if (cookiePairs.length === 0) {
      return headers;
    }

    const existing = headers.get('cookie');
    headers.set(
      'cookie',
      existing
        ? `${existing}; ${cookiePairs.join('; ')}`
        : cookiePairs.join('; '),
    );

    return headers;
  }

  private async deletePreviousProfileImage(
    previousImage: string | null,
  ): Promise<void> {
    const key = this.tryExtractProfilesObjectKey(previousImage);
    if (!key) {
      if (previousImage) {
        this.logger.debug(
          `Skipping previous profile image delete; no profiles/ object key in URL: ${previousImage}`,
        );
      }
      return;
    }

    try {
      await this.storageService.deleteFile(key);
      this.logger.log(`Deleted previous profile image: ${key}`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete previous profile image: ${key}`,
        error,
      );
    }
  }

  private tryExtractProfilesObjectKey(imageUrl: string | null): string | null {
    if (!imageUrl) {
      return null;
    }

    // For Cloudinary, public URLs often look like:
    // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/profiles/<uuid>.webp
    // Or without version.

    const match = imageUrl.match(/(profiles\/[^/?#]+)/);
    return match?.[1] ?? null;
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
