import { Injectable } from '@nestjs/common';

import { badRequestError, notFoundError } from '../../core/errors/domain-error';
import type { SessionsListQueryDto } from '../sessions/schemas/sessions.schema';
import { SessionsRepository } from './sessions.repository';
import { mapSessionResponse } from './sessions.mapper';
import { IncomingHttpHeaders } from 'node:http';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly authService: AuthService,
  ) {}

  async listSessions(
    currentUser: CurrentUser,
    currentToken: string,
    currentSessionId: number,
    clientIp: string | null,
    clientUserAgent: string | null,
    query: SessionsListQueryDto,
  ) {
    await this.sessionsRepository.updateSessionMetadata(
      currentSessionId,
      clientIp,
      clientUserAgent,
    );

    const result = await this.sessionsRepository.listSessions(
      currentUser.id,
      query,
    );

    const activeOtherSessionCount =
      await this.sessionsRepository.countActiveOtherSessions(
        currentUser.id,
        currentSessionId,
      );

    return {
      rows: result.rows.map((row) => mapSessionResponse(row, currentToken)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      activeOtherSessionCount,
    };
  }

  async revokeSession(
    currentUser: CurrentUser,
    sessionPublicId: string,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<{ revoked: true; cookies: string[] }> {
    const session =
      await this.sessionsRepository.findSessionByPublicId(sessionPublicId);

    if (!session || session.userId !== currentUser.id) {
      throw notFoundError('session_not_found', 'Session not found');
    }

    const result = await this.authService.revokeSession(
      sessionPublicId,
      requestHeaders,
    );

    return { revoked: true, cookies: result.cookies };
  }

  async revokeOtherSessions(
    currentUser: CurrentUser,
    currentSessionId: number,
  ): Promise<{ revokedCount: number }> {
    const revokedCount = await this.sessionsRepository.softRevokeOtherSessions(
      currentUser.id,
      currentSessionId,
    );

    return { revokedCount };
  }

  async deleteSession(
    currentUser: CurrentUser,
    sessionPublicId: string,
    currentToken: string,
  ): Promise<{ deleted: true }> {
    const session =
      await this.sessionsRepository.findSessionByPublicId(sessionPublicId);

    if (!session || session.userId !== currentUser.id) {
      throw notFoundError('session_not_found', 'Session not found');
    }

    const now = new Date();
    const isRevoked = session.revokedAt != null;
    const isExpired = session.expiresAt <= now;
    const isCurrent = !isRevoked && session.token === currentToken;

    if (isCurrent) {
      throw badRequestError('Cannot delete the current active session');
    }

    if (!isRevoked && !isExpired) {
      throw badRequestError('Only revoked or expired sessions can be deleted');
    }

    await this.sessionsRepository.deleteSessionById(session.id);

    return { deleted: true };
  }

  async revokeAllSessionsForUser(userId: number): Promise<number> {
    return this.sessionsRepository.revokeAllSessionsForUser(userId);
  }
}
