import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DatabaseModule } from '../../core/database/database.module';
import schema from '../../core/database/drizzle/drizzle.schema';
import { DRIZZLE_DATABASE_CONNECTION } from '../../core/database/drizzle/drizzle.tokens';
import type { EnvType } from '../../core/validators/env';

import { AuthController } from './auth.controller';
import { createAuth } from './auth.factory';
import { AuthService } from './auth.service';

@Module({
  imports: [
    DatabaseModule,
    BetterAuthModule.forRootAsync({
      imports: [ConfigModule, DatabaseModule],
      inject: [DRIZZLE_DATABASE_CONNECTION, ConfigService],
      disableControllers: true,
      disableGlobalAuthGuard: true,
      useFactory: (
        database: NodePgDatabase<typeof schema>,
        configService: ConfigService<EnvType, true>,
      ) => ({
        auth: createAuth(database, configService),
        disableTrustedOriginsCors: true,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
