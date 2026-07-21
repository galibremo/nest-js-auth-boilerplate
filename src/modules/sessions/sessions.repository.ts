import { Inject, Injectable } from '@nestjs/common';
import type { SQL } from 'drizzle-orm';
import {
  and,
  count,
  desc,
  gt,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  eq,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { orderByColumn } from '../../core/database/helpers';
import type { SessionsListQueryDto } from '../sessions/schemas/sessions.schema';
import type { SessionRow } from './sessions.types';
import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';
import { randomUUID } from 'node:crypto';

type SessionsDatabase = NodePgDatabase<typeof schema>;

function toSessionRow(
  row: typeof schema.sessions.$inferSelect & {
    user: typeof schema.users.$inferSelect;
  },
): SessionRow {
  return {
    id: row.id,
    publicId: row.publicId,
    token: row.token,
    expiresAt: row.expiresAt,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    loginMethod: row.loginMethod,
    revokedAt: row.revokedAt,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    userRole: row.user.role,
  };
}

@Injectable()
export class SessionsRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: SessionsDatabase,
  ) {}

  async listSessions(
    userId: number,
    query: SessionsListQueryDto,
  ): Promise<{
    rows: SessionRow[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const now = new Date();
    const whereClause = this.getListWhere(userId, query, now);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;
    const orderBy = this.getOrderBy(query.sort, query.dir);

    const [rawRows, totalRows] = await Promise.all([
      this.db.query.sessions.findMany({
        where: whereClause,
        with: { user: true },
        orderBy: orderBy ?? desc(schema.sessions.createdAt),
        limit: pageSize,
        offset,
      }),
      this.db
        .select({ value: count() })
        .from(schema.sessions)
        .where(whereClause),
    ]);

    return {
      rows: rawRows.map(toSessionRow),
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async findSessionByPublicId(
    publicId: string,
  ): Promise<SessionRow | undefined> {
    const row = await this.db.query.sessions.findFirst({
      where: eq(schema.sessions.publicId, publicId),
      with: { user: true },
    });

    return row ? toSessionRow(row) : undefined;
  }

  async updateSessionMetadata(
    sessionId: number,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    await this.db
      .update(schema.sessions)
      .set({
        ...(ipAddress !== null ? { ipAddress } : {}),
        ...(userAgent !== null ? { userAgent } : {}),
      })
      .where(eq(schema.sessions.id, sessionId));
  }

  async softRevokeSessionById(sessionId: number): Promise<boolean> {
    const result = await this.db
      .update(schema.sessions)
      .set({
        revokedAt: new Date(),
        token: `revoked_${randomUUID()}`,
      })
      .where(
        and(
          eq(schema.sessions.id, sessionId),
          isNull(schema.sessions.revokedAt),
        ),
      )
      .returning({ id: schema.sessions.id });

    return result.length > 0;
  }

  async softRevokeOtherSessions(
    userId: number,
    currentSessionId: number,
  ): Promise<number> {
    const rows = await this.db
      .select({ id: schema.sessions.id })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          ne(schema.sessions.id, currentSessionId),
          isNull(schema.sessions.revokedAt),
        ),
      );

    const revokedAt = new Date();

    for (const row of rows) {
      await this.db
        .update(schema.sessions)
        .set({
          revokedAt,
          token: `revoked_${randomUUID()}`,
        })
        .where(eq(schema.sessions.id, row.id));
    }

    return rows.length;
  }

  async deleteSessionById(sessionId: number): Promise<void> {
    await this.db
      .delete(schema.sessions)
      .where(eq(schema.sessions.id, sessionId));
  }

  async revokeAllSessionsForUser(userId: number): Promise<number> {
    const revokedSessions = await this.db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .returning({ id: schema.sessions.id });

    return revokedSessions.length;
  }

  async countActiveOtherSessions(
    userId: number,
    currentSessionId: number,
  ): Promise<number> {
    const now = new Date();
    const result = await this.db
      .select({ value: count() })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          ne(schema.sessions.id, currentSessionId),
          isNull(schema.sessions.revokedAt),
          gt(schema.sessions.expiresAt, now),
        ),
      );

    return Number(result[0]?.value ?? 0);
  }

  private getListWhere(
    userId: number,
    query: SessionsListQueryDto,
    now: Date,
  ): SQL<unknown> | undefined {
    const conditions: SQL<unknown>[] = [eq(schema.sessions.userId, userId)];

    if (query.search) {
      const q = `%${query.search}%`;
      conditions.push(
        or(
          ilike(schema.sessions.ipAddress, q),
          ilike(schema.sessions.userAgent, q),
        ) as SQL<unknown>,
      );
    }

    if (query.status?.length) {
      const statusConditions: SQL<unknown>[] = [];

      if (query.status.includes('active')) {
        statusConditions.push(
          and(
            isNull(schema.sessions.revokedAt),
            gt(schema.sessions.expiresAt, now),
          ) as SQL<unknown>,
        );
      }

      if (query.status.includes('expired')) {
        statusConditions.push(
          and(
            isNull(schema.sessions.revokedAt),
            lte(schema.sessions.expiresAt, now),
          ) as SQL<unknown>,
        );
      }

      if (query.status.includes('revoked')) {
        statusConditions.push(isNotNull(schema.sessions.revokedAt));
      }

      if (statusConditions.length === 1) {
        conditions.push(statusConditions[0]);
      } else if (statusConditions.length > 1) {
        conditions.push(or(...statusConditions) as SQL<unknown>);
      }
    }

    if (query.fromDate) {
      conditions.push(gte(schema.sessions.createdAt, query.fromDate));
    }

    if (query.toDate) {
      const toDate = new Date(query.toDate);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(schema.sessions.createdAt, toDate));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getOrderBy(
    sort: string | undefined,
    dir: 'asc' | 'desc' | undefined,
  ): SQL<unknown> | undefined {
    const direction = dir ?? 'desc';

    return orderByColumn(schema.sessions, sort, direction);
  }
}
