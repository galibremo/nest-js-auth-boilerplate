import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  SQL,
  sql,
} from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import schema from 'src/core/database/drizzle/drizzle.schema';
import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import { WorkspaceSchemaType } from 'src/core/database/drizzle/drizzle.types';
import { WorkspaceListQueryDto } from './schemas/workspace.schema';
import { desc } from 'drizzle-orm';
import { orderByColumn } from 'src/core/database/helpers';
import { WorkspaceManagementRow } from './workspace.types';

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

  findWorkspaceById(id: number): Promise<WorkspaceSchemaType | undefined> {
    return this.db.query.workspaces.findFirst({
      where: eq(schema.workspaces.id, id),
    });
  }

  findWorkspaceByName(
    name: string,
    ownerId: number,
    excludeWorkspaceId?: number,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db.query.workspaces.findFirst({
      where: and(
        eq(schema.workspaces.ownerId, ownerId),
        eq(schema.workspaces.name, name),
        isNull(schema.workspaces.deletedAt),
        excludeWorkspaceId
          ? sql`${schema.workspaces.id} != ${excludeWorkspaceId}`
          : undefined,
      ),
    });
  }

  async listWorkspaces(query: WorkspaceListQueryDto): Promise<{
    rows: WorkspaceManagementRow[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;
    const memberCountSql = this.memberCountSql();
    const whereClause = this.getListWorkspacesWhere(query);
    const orderBy = this.getWorkspacesOrderBy(
      query.sort,
      query.dir,
      memberCountSql,
    );

    const [workspaces, totalRows] = await Promise.all([
      this.db.query.workspaces.findMany({
        where: whereClause,
        orderBy: orderBy ?? desc(schema.workspaces.createdAt),
        limit: pageSize,
        offset: offset,
        with: {
          owner: true,
        },
        extras: {
          memberCount: memberCountSql.as('memberCount'),
        },
      }),
      this.db
        .select({ value: count() })
        .from(schema.workspaces)
        .where(whereClause),
    ]);

    const rows = workspaces.map((w) => ({
      id: w.id,
      publicId: w.publicId,
      name: w.name,
      status: w.status,
      deletedAt: w.deletedAt,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      memberCount: w.memberCount,
      ownerId: w.ownerId,
      ownerPublicId: w.owner?.publicId ?? null,
      ownerName: w.owner?.name ?? null,
      ownerEmail: w.owner?.email ?? null,
    }));

    return { rows, total: Number(totalRows[0]?.value ?? 0), page, pageSize };
  }

  async createWorkspace(
    data: Omit<
      typeof schema.workspaces.$inferInsert,
      'id' | 'publicId' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db
      .insert(schema.workspaces)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async updateWorkspace(
    workspaceId: number,
    data: Partial<
      Pick<typeof schema.workspaces.$inferInsert, 'name' | 'status'>
    >,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db
      .update(schema.workspaces)
      .set(data)
      .where(eq(schema.workspaces.id, workspaceId))
      .returning()
      .then((rows) => rows[0]);
  }

  async deleteWorkspace(
    workspaceId: number,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db
      .delete(schema.workspaces)
      .where(eq(schema.workspaces.id, workspaceId))
      .returning()
      .then((row) => row[0]);
  }

  async archiveWorkspace(
    workspaceId: number,
    archivedName: string,
  ): Promise<WorkspaceSchemaType | undefined> {
    return this.db
      .update(schema.workspaces)
      .set({ deletedAt: new Date(), name: archivedName })
      .where(eq(schema.workspaces.id, workspaceId))
      .returning()
      .then((rows) => rows[0]);
  }

  private memberCountSql(): SQL<number> {
    return sql<number>`(
      SELECT COALESCE(COUNT(DISTINCT ${schema.workspaceMembers.userId}), 0)::int
      FROM ${schema.workspaceMembers}
      WHERE ${schema.workspaceMembers.workspaceId} = ${schema.workspaces.id}
    )`;
  }

  private getListWorkspacesWhere(
    query: WorkspaceListQueryDto,
  ): SQL<unknown> | undefined {
    const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
    const toDate = query.toDate ? new Date(query.toDate) : undefined;

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const q = query.search ? `%${query.search}%` : undefined;
    const searchExists = q ? ilike(schema.workspaces.name, q) : undefined;

    const conditions = [
      isNull(schema.workspaces.deletedAt),
      searchExists,
      query.status?.length
        ? inArray(schema.workspaces.status, query.status)
        : undefined,
      fromDate ? gte(schema.workspaces.createdAt, fromDate) : undefined,
      toDate ? lte(schema.workspaces.createdAt, toDate) : undefined,
    ].filter(Boolean) as SQL<unknown>[];

    return conditions.length > 0
      ? and(...conditions)
      : isNull(schema.workspaces.deletedAt);
  }

  private getWorkspacesOrderBy(
    sort: string | undefined,
    dir: 'asc' | 'desc' | undefined,
    memberCountSql: SQL<number>,
  ): SQL<unknown> | undefined {
    const direction = dir ?? 'desc';

    if (sort === 'memberCount') {
      return direction === 'desc' ? desc(memberCountSql) : asc(memberCountSql);
    }

    return orderByColumn(schema.workspaces, sort, direction);
  }
}
