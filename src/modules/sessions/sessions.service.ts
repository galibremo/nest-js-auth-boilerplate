import { Injectable } from '@nestjs/common';

import { notFoundError } from '../../core/errors/domain-error';
import type { SessionsListQueryDto } from '../sessions/schemas/sessions.schema';
import { SessionsRepository } from './sessions.repository';
import { mapSessionResponse } from './sessions.mapper';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

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
  ): Promise<{ revoked: true }> {
    const session =
      await this.sessionsRepository.findSessionByPublicId(sessionPublicId);

    if (!session) throw notFoundError('session_not_found', 'Session not found');

    if (session.userId !== currentUser.id) {
      throw notFoundError('session_not_found', 'Session not found');
    }

    await this.sessionsRepository.revokeSessionById(session.id);

    return { revoked: true };
  }

  async revokeOtherSessions(
    currentUser: CurrentUser,
    currentSessionId: number,
  ): Promise<{ revokedCount: number }> {
    const revokedCount = await this.sessionsRepository.revokeOtherSessions(
      currentUser.id,
      currentSessionId,
    );

    return { revokedCount };
  }
}
