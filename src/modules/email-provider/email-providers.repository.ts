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
  inArray,
  lte,
  ne,
  or,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { orderByColumn } from '../../core/database/helpers';
import schema from '../../core/database/drizzle/drizzle.schema';
import type { EmailProviderSchemaType } from '../../core/database/drizzle/drizzle.types';
import { LEGACY_EMAIL_PROVIDER_TYPE_ALIASES } from './email-provider.interface';
import type { EmailProvidersListQueryDto } from './schemas/email-providers.schema';
import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';

export type EmailProvidersDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class EmailProvidersRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: EmailProvidersDatabase,
  ) {}

  async findAll(query: EmailProvidersListQueryDto): Promise<{
    rows: EmailProviderSchemaType[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const whereClause = this.getWhereClause(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;
    const orderBy = orderByColumn(
      schema.emailProviders,
      query.sort,
      query.dir ?? 'desc',
    );

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(schema.emailProviders)
        .where(whereClause)
        .orderBy(orderBy ?? desc(schema.emailProviders.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(schema.emailProviders)
        .where(whereClause),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async findByPublicId(
    publicId: string,
  ): Promise<EmailProviderSchemaType | undefined> {
    return this.db.query.emailProviders.findFirst({
      where: eq(schema.emailProviders.publicId, publicId),
    });
  }

  async findDefaultActive(): Promise<EmailProviderSchemaType | undefined> {
    return this.db.query.emailProviders.findFirst({
      where: and(
        eq(schema.emailProviders.isDefault, true),
        eq(schema.emailProviders.isActive, true),
      ),
    });
  }

  async findAllActive(): Promise<EmailProviderSchemaType[]> {
    return this.db
      .select()
      .from(schema.emailProviders)
      .where(eq(schema.emailProviders.isActive, true))
      .orderBy(
        desc(schema.emailProviders.isDefault),
        asc(schema.emailProviders.createdAt),
      );
  }

  async create(
    data: typeof schema.emailProviders.$inferInsert,
  ): Promise<EmailProviderSchemaType | undefined> {
    return this.db
      .insert(schema.emailProviders)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async update(
    id: number,
    data: Partial<typeof schema.emailProviders.$inferInsert>,
  ): Promise<EmailProviderSchemaType | undefined> {
    return this.db
      .update(schema.emailProviders)
      .set(data)
      .where(eq(schema.emailProviders.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  async delete(id: number): Promise<EmailProviderSchemaType | undefined> {
    return this.db
      .delete(schema.emailProviders)
      .where(eq(schema.emailProviders.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  async clearAllDefaults(exceptId?: number): Promise<void> {
    if (exceptId) {
      await this.db
        .update(schema.emailProviders)
        .set({ isDefault: false })
        .where(
          and(
            eq(schema.emailProviders.isDefault, true),
            ne(schema.emailProviders.id, exceptId),
          ),
        );
    } else {
      await this.db
        .update(schema.emailProviders)
        .set({ isDefault: false })
        .where(eq(schema.emailProviders.isDefault, true));
    }
  }

  async updateTestStatus(
    id: number,
    status: 'success' | 'failed',
    testedAt: Date,
  ): Promise<EmailProviderSchemaType | undefined> {
    return this.db
      .update(schema.emailProviders)
      .set({ lastTestStatus: status, lastTestedAt: testedAt })
      .where(eq(schema.emailProviders.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  async countActive(): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(schema.emailProviders)
      .where(eq(schema.emailProviders.isActive, true));

    return Number(result[0]?.value ?? 0);
  }

  private getWhereClause(
    query: EmailProvidersListQueryDto,
  ): SQL<unknown> | undefined {
    const conditions: (SQL<unknown> | undefined)[] = [];

    if (query.search) {
      const q = `%${query.search}%`;
      conditions.push(
        or(
          ilike(schema.emailProviders.name, q),
          ilike(schema.emailProviders.providerType, q),
        ),
      );
    }

    if (query.providerType) {
      const legacyTypes = this.getLegacyProviderTypes(query.providerType);
      conditions.push(
        legacyTypes.length > 0
          ? inArray(schema.emailProviders.providerType, [
              query.providerType,
              ...legacyTypes,
            ])
          : eq(schema.emailProviders.providerType, query.providerType),
      );
    }

    if (typeof query.isActive === 'boolean') {
      conditions.push(eq(schema.emailProviders.isActive, query.isActive));
    }

    if (query.fromDate) {
      conditions.push(
        gte(schema.emailProviders.createdAt, new Date(query.fromDate)),
      );
    }

    if (query.toDate) {
      const toDate = new Date(query.toDate);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(schema.emailProviders.createdAt, toDate));
    }

    const filtered = conditions.filter(Boolean) as SQL<unknown>[];
    return filtered.length > 0 ? and(...filtered) : undefined;
  }

  private getLegacyProviderTypes(providerType: string): string[] {
    return Object.entries(LEGACY_EMAIL_PROVIDER_TYPE_ALIASES)
      .filter(([, canonicalType]) => canonicalType === providerType)
      .map(([legacyType]) => legacyType);
  }
}
