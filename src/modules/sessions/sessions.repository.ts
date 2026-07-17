import { Inject, Injectable } from '@nestjs/common';
import type { SQL } from 'drizzle-orm';
import { and, count, desc, eq, gt, gte, ilike, lte, ne, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { orderByColumn } from '../../core/database/helpers';
import type { SessionsListQueryDto } from '../sessions/schemas/sessions.schema';
import type { SessionRow } from './sessions.types';
import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

type SessionsDatabase = NodePgDatabase<typeof schema>;

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

    const [rows, totalRows] = await Promise.all([
      this.db
        .select({
          id: schema.sessions.id,
          publicId: schema.sessions.publicId,
          token: schema.sessions.token,
          expiresAt: schema.sessions.expiresAt,
          ipAddress: schema.sessions.ipAddress,
          userAgent: schema.sessions.userAgent,
          userId: schema.sessions.userId,
          userRole: schema.users.role,
          createdAt: schema.sessions.createdAt,
          updatedAt: schema.sessions.updatedAt,
        })
        .from(schema.sessions)
        .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
        .where(whereClause)
        .orderBy(orderBy ?? desc(schema.sessions.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(schema.sessions)
        .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
        .where(whereClause),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async findSessionByPublicId(
    publicId: string,
  ): Promise<SessionRow | undefined> {
    const rows = await this.db
      .select({
        id: schema.sessions.id,
        publicId: schema.sessions.publicId,
        token: schema.sessions.token,
        expiresAt: schema.sessions.expiresAt,
        ipAddress: schema.sessions.ipAddress,
        userAgent: schema.sessions.userAgent,
        userId: schema.sessions.userId,
        userRole: schema.users.role,
        createdAt: schema.sessions.createdAt,
        updatedAt: schema.sessions.updatedAt,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(eq(schema.sessions.publicId, publicId))
      .limit(1);

    return rows[0];
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

  async revokeSessionById(sessionId: number): Promise<void> {
    await this.db
      .delete(schema.sessions)
      .where(eq(schema.sessions.id, sessionId));
  }

  async revokeOtherSessions(
    userId: number,
    currentSessionId: number,
  ): Promise<number> {
    const result = await this.db
      .delete(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          ne(schema.sessions.id, currentSessionId),
        ),
      )
      .returning({ id: schema.sessions.id });

    return result.length;
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
      if (
        query.status.includes('active') &&
        !query.status.includes('expired')
      ) {
        conditions.push(gt(schema.sessions.expiresAt, now));
      } else if (
        query.status.includes('expired') &&
        !query.status.includes('active')
      ) {
        conditions.push(lte(schema.sessions.expiresAt, now));
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
