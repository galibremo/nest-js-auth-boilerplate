import { Inject, Injectable } from '@nestjs/common';
import type { SQL } from 'drizzle-orm';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { orderByColumn } from '../../core/database/helpers';

import type { UsersListQueryDto } from './schemas/users.schema';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import { UserSchemaType } from 'src/core/database/drizzle/drizzle.types';
import { UserManagementRow } from './users.types';
import schema from 'src/core/database/drizzle/drizzle.schema';

export type UsersDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: UsersDatabase,
  ) {}

  findUserByPublicId(publicId: string): Promise<UserSchemaType | undefined> {
    return this.db.query.users.findFirst({
      where: eq(schema.users.publicId, publicId),
    });
  }

  findUserByEmail(email: string): Promise<UserSchemaType | undefined> {
    return this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  }

  async listUsers(query: UsersListQueryDto): Promise<{
    rows: UserManagementRow[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const now = new Date();
    const whereClause = this.getListUsersWhere(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;
    const activeSessionCount = this.activeSessionCountSql(now);
    const orderBy = this.getUsersOrderBy(
      query.sort,
      query.dir,
      activeSessionCount,
    );

    const [rows, totalRows] = await Promise.all([
      this.db
        .select(this.userManagementSelection(activeSessionCount))
        .from(schema.users)
        .leftJoin(schema.sessions, eq(schema.users.id, schema.sessions.userId))
        .where(whereClause)
        .groupBy(
          schema.users.id,
          schema.users.publicId,
          schema.users.name,
          schema.users.email,
          schema.users.image,
          schema.users.emailVerified,
          schema.users.createdAt,
          schema.users.updatedAt,
        )
        .orderBy(orderBy ?? desc(schema.users.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ value: count() }).from(schema.users).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async createUser(
    data: typeof schema.users.$inferInsert,
  ): Promise<UserSchemaType | undefined> {
    return this.db
      .insert(schema.users)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async createCredentialAccount(params: {
    userId: number;
    passwordHash: string;
  }): Promise<typeof schema.accounts.$inferSelect | undefined> {
    return this.db
      .insert(schema.accounts)
      .values({
        userId: params.userId,
        accountId: String(params.userId),
        providerId: 'credential',
        password: params.passwordHash,
      })
      .returning()
      .then((rows) => rows[0]);
  }

  async findUserManagementRowById(
    userId: number,
  ): Promise<UserManagementRow | undefined> {
    const activeSessionCount = this.activeSessionCountSql(new Date());

    return this.db
      .select(this.userManagementSelection(activeSessionCount))
      .from(schema.users)
      .leftJoin(schema.sessions, eq(schema.users.id, schema.sessions.userId))
      .where(eq(schema.users.id, userId))
      .groupBy(
        schema.users.id,
        schema.users.publicId,
        schema.users.name,
        schema.users.email,
        schema.users.image,
        schema.users.emailVerified,
        schema.users.createdAt,
        schema.users.updatedAt,
      )
      .then((rows) => rows[0]);
  }

  async updateUser(
    userId: number,
    data: Partial<typeof schema.users.$inferInsert>,
  ): Promise<UserSchemaType | undefined> {
    return this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, userId))
      .returning()
      .then((rows) => rows[0]);
  }

  async deleteUser(userId: number): Promise<UserSchemaType | undefined> {
    return this.db
      .delete(schema.users)
      .where(eq(schema.users.id, userId))
      .returning()
      .then((rows) => rows[0]);
  }

  async revokeUserSessions(userId: number): Promise<number> {
    const revokedSessions = await this.db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .returning({ id: schema.sessions.id });

    return revokedSessions.length;
  }

  private getListUsersWhere(
    query: UsersListQueryDto,
  ): SQL<unknown> | undefined {
    const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
    const toDate = query.toDate ? new Date(query.toDate) : undefined;

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const q = query.search ? `%${query.search}%` : undefined;
    const searchExists = q
      ? or(ilike(schema.users.name, q), ilike(schema.users.email, q))
      : undefined;

    const conditions = [
      searchExists,
      typeof query.emailVerified === 'boolean'
        ? eq(schema.users.emailVerified, query.emailVerified)
        : undefined,
      fromDate ? gte(schema.users.createdAt, fromDate) : undefined,
      toDate ? lte(schema.users.createdAt, toDate) : undefined,
    ].filter(Boolean) as SQL<unknown>[];

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getUsersOrderBy(
    sort: string | undefined,
    dir: 'asc' | 'desc' | undefined,
    activeSessionCount: SQL<number>,
  ): SQL<unknown> | undefined {
    const direction = dir ?? 'desc';

    if (sort === 'activeSessionCount') {
      return direction === 'desc'
        ? desc(activeSessionCount)
        : asc(activeSessionCount);
    }

    return orderByColumn(schema.users, sort, direction);
  }

  private activeSessionCountSql(now: Date): SQL<number> {
    return sql<number>`COALESCE(COUNT(${schema.sessions.id}) FILTER (WHERE ${schema.sessions.expiresAt} > ${now}), 0)::int`;
  }

  private userManagementSelection(activeSessionCount: SQL<number>) {
    return {
      id: schema.users.id,
      publicId: schema.users.publicId,
      name: schema.users.name,
      email: schema.users.email,
      image: schema.users.image,
      emailVerified: schema.users.emailVerified,
      activeSessionCount,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
    };
  }
}
