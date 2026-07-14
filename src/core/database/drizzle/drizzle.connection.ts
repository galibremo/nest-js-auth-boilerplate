import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import schema from './drizzle.schema';
import { DRIZZLE_DATABASE_CONNECTION } from './drizzle.tokens';

export { DRIZZLE_DATABASE_CONNECTION };

export default function createDrizzleConnection(configService: ConfigService) {
  const pool = new Pool({
    connectionString: configService.getOrThrow('DATABASE_URL'),
  });
  return drizzle(pool, { schema });
}
