import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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
}
