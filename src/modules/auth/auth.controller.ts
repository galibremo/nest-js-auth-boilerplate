import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AuthInstance } from './auth.factory';
import { AuthService } from './auth.service';
import type { GoogleSignInInput } from './schemas/google.schema';
import { GoogleSignInInputSchema } from './schemas/google.schema';
import type { LoginInput, LoginResponse } from './schemas/login.schema';
import { LoginInputSchema, LoginResponseSchema } from './schemas/login.schema';
import type { LogoutResponse } from './schemas/logout.schema';
import { LogoutResponseSchema } from './schemas/logout.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  ChangePasswordInput,
  ChangePasswordResponse,
  SetPasswordInput,
  SetPasswordResponse,
} from './schemas/password.schema';
import {
  ChangePasswordInputSchema,
  ChangePasswordResponseSchema,
  SetPasswordInputSchema,
  SetPasswordResponseSchema,
} from './schemas/password.schema';
import type {
  RegisterInput,
  RegisterResponse,
} from './schemas/register.schema';
import {
  RegisterInputSchema,
  RegisterResponseSchema,
} from './schemas/register.schema';
import {
  MAX_PROFILE_IMAGE_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
  type UpdateProfileInput,
  UpdateProfileInputSchema,
  UpdateProfileResponse,
  UpdateProfileResponseSchema,
} from './schemas/profile.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ──────────────────────────────────────────────
  // Public endpoints (no auth guard required)
  // ──────────────────────────────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(RegisterInputSchema))
  async register(
    @Body() input: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponse> {
    const response = await this.authService.register(input, req.headers);
    this.appendCookies(res, response.cookies);

    return RegisterResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Registration successful',
        data: response.user,
        path: req.url,
      }),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginInputSchema))
  async login(
    @Body() input: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const response = await this.authService.login(input, req.headers);
    this.appendCookies(res, response.cookies);

    return LoginResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: response.user,
        path: req.url,
      }),
    );
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(GoogleSignInInputSchema))
  async googleSignIn(
    @Body() input: GoogleSignInInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const response = await this.authService.googleSignIn(
      input.idToken,
      req.headers,
    );
    this.appendCookies(res, response.cookies);

    return LoginResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Google login successful',
        data: response.user,
        path: req.url,
      }),
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponse> {
    const result = await this.authService.logout(req.headers);
    this.appendCookies(res, result.cookies);

    return LogoutResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Logged out successfully',
        data: result.success,
        path: req.url,
      }),
    );
  }

  // ──────────────────────────────────────────────
  // Protected endpoints (require valid session)
  // ──────────────────────────────────────────────

  @Get('session')
  @UseGuards(AuthGuard)
  getSession(
    @Session() session: UserSession<AuthInstance>,
    @Req() req: Request,
  ): LoginResponse {
    return LoginResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Session retrieved successfully',
        data: session.user,
        path: req.url,
      }),
    );
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(SetPasswordInputSchema))
  async setPassword(
    @Body() input: SetPasswordInput,
    @Req() req: Request,
  ): Promise<SetPasswordResponse> {
    const status = await this.authService.setUserPassword(input, req.headers);

    return SetPasswordResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Password set successfully',
        data: status,
        path: req.url,
      }),
    );
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(ChangePasswordInputSchema))
  async changePassword(
    @Body() input: ChangePasswordInput,
    @Req() req: Request,
  ): Promise<ChangePasswordResponse> {
    const user = await this.authService.changeUserPassword(input, req.headers);

    return ChangePasswordResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Password changed successfully',
        data: user,
        path: req.url,
      }),
    );
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateProfileInputSchema))
  async updateProfile(
    @Body() input: UpdateProfileInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UpdateProfileResponse> {
    const { user, cookies } = await this.authService.updateProfile(
      input,
      req.headers,
    );
    this.appendCookies(res, cookies);

    return UpdateProfileResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Profile updated successfully',
        data: user,
        path: req.url,
      }),
    );
  }

  @Put('profile/image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: {
        fileSize: MAX_PROFILE_IMAGE_BYTES,
      },
      fileFilter: (_req, file, callback) => {
        const mimeType =
          file.mimetype as (typeof PROFILE_IMAGE_MIME_TYPES)[number];
        if (!PROFILE_IMAGE_MIME_TYPES.includes(mimeType)) {
          return callback(
            new Error('Profile image must be a PNG, JPG, or WEBP file.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────
  private appendCookies(response: Response, cookies: string[]): void {
    cookies.forEach((cookie) => {
      response.append('Set-Cookie', cookie);
    });
  }
}
