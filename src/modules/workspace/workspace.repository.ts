import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import schema from 'src/core/database/drizzle/drizzle.schema';
import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import { WorkspaceSchemaType } from 'src/core/database/drizzle/drizzle.types';

export type UsersDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class WorkspaceRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: UsersDatabase,
  ) {}

  findWorkspaceByPublicId(
    publicId: string,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db.query.workspaces.findFirst({
      where: eq(schema.workspaces.publicId, publicId),
    });
  }

  async createWorkspace(
    data: typeof schema.workspaces.$inferInsert,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db
      .insert(schema.workspaces)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async updateWorkspace(
    workspaceId: number,
    data: Partial<typeof schema.workspaces.$inferInsert>,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db
      .update(schema.workspaces)
      .set(data)
      .where(eq(schema.workspaces.id, workspaceId))
      .returning()
      .then((rows) => rows[0]);
  }
}
