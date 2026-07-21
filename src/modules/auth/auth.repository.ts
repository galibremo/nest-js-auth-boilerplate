import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { SessionRow } from '../sessions/sessions.types';
import schema from 'src/core/database/drizzle/drizzle.schema';
import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';

type UserDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: UserDatabase,
  ) {}

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
        loginMethod: schema.sessions.loginMethod,
        revokedAt: schema.sessions.revokedAt,
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

  async hasCredentialAccount(userId: number): Promise<boolean> {
    const rows = await this.db
      .select({ id: schema.accounts.id })
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, userId),
          eq(schema.accounts.providerId, 'credential'),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async findUserByEmail(
    email: string,
  ): Promise<typeof schema.users.$inferSelect | undefined> {
    const rows = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return rows[0];
  }
}
