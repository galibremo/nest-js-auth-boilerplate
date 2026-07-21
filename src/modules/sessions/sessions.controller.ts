import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest, Response } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import type { AuthInstance } from '../auth/auth.factory';
import { mapUserResponse } from '../auth/auth.mapper';
import type {
  DeleteSessionApiResponse,
  RevokeOtherSessionsApiResponse,
  RevokeSessionApiResponse,
  SessionListApiResponse,
  SessionsListQueryDto,
} from '../sessions/schemas/sessions.schema';
import {
  DeleteSessionApiResponseSchema,
  RevokeOtherSessionsApiResponseSchema,
  RevokeSessionApiResponseSchema,
  SessionListApiResponseSchema,
  SessionsListQuerySchema,
} from '../sessions/schemas/sessions.schema';
import { SessionsService } from '../sessions/sessions.service';

@UseGuards(AuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async listSessions(
    @Session() session: UserSession<AuthInstance>,
    @Req() request: ExpressRequest,
    @Query(new ZodValidationPipe(SessionsListQuerySchema))
    query: SessionsListQueryDto,
  ): Promise<SessionListApiResponse> {
    const currentUser = mapUserResponse(session);
    const currentToken = session.session.token;
    const currentSessionId = Number(session.session.id);
    const forwardedFor = request.headers['x-forwarded-for'];
    const clientIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : (request.ip ?? null);
    const clientUserAgent =
      typeof request.headers['user-agent'] === 'string'
        ? request.headers['user-agent']
        : null;

    const data = await this.sessionsService.listSessions(
      currentUser,
      currentToken,
      currentSessionId,
      clientIp,
      clientUserAgent,
      query,
    );

    return SessionListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Sessions fetched successfully',
        data,
        path: request.url,
      }),
    );
  }

  @Post('revoke-others')
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(
    @Session() session: UserSession<AuthInstance>,
    @Req() request: ExpressRequest,
  ): Promise<RevokeOtherSessionsApiResponse> {
    const currentUser = mapUserResponse(session);
    const currentSessionId = Number(session.session.id);

    const data = await this.sessionsService.revokeOtherSessions(
      currentUser,
      currentSessionId,
    );

    return RevokeOtherSessionsApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Other sessions revoked successfully',
        data,
        path: request.url,
      }),
    );
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Session() session: UserSession<AuthInstance>,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RevokeSessionApiResponse> {
    const currentUser = mapUserResponse(session);

    const data = await this.sessionsService.revokeSession(
      currentUser,
      id,
      request.headers,
    );
    this.appendCookies(res, data.cookies);

    return RevokeSessionApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Session revoked successfully',
        data: { revoked: data.revoked },
        path: request.url,
      }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteSession(
    @Session() session: UserSession<AuthInstance>,
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteSessionApiResponse> {
    const currentUser = mapUserResponse(session);
    const currentToken = session.session.token;

    const data = await this.sessionsService.deleteSession(
      currentUser,
      id,
      currentToken,
    );

    return DeleteSessionApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Session deleted successfully',
        data,
        path: request.url,
      }),
    );
  }

  private appendCookies(response: Response, cookies: string[]): void {
    cookies.forEach((cookie) => {
      response.appendHeader('Set-Cookie', cookie);
    });
  }
}
