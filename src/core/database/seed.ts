import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { createAuth } from '../../modules/auth/auth.factory';
import { type EnvType, validateEnv } from '../validators/env';
import schema from './drizzle/drizzle.schema';
import { seedEmailTemplates } from './seeds/email-template.seed';
import { seedUser } from './seeds/user.seed';

async function main(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is required to run database seeders.');
    }

    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });
    const configService = new ConfigService<EnvType, true>(validateEnv(process.env));
    const auth = createAuth(db, configService);

    try {
        await seedUser(db, auth);
        await seedEmailTemplates(db);
        console.log('Database seed completed successfully.');
    } finally {
        await pool.end();
    }
}

main().catch(error => {
    console.error('Database seed failed:', error);
    process.exit(1);
});
