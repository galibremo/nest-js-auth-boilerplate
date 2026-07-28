import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DatabaseModule } from '../../core/database/database.module';
import schema from '../../core/database/drizzle/drizzle.schema';
import { DRIZZLE_DATABASE_CONNECTION } from '../../core/database/drizzle/drizzle.tokens';
import type { EnvType } from '../../core/validators/env';

import { AuthController } from './auth.controller';
import { createAuth } from './auth.factory';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SessionsModule } from '../sessions/sessions.module';
import { MediaService } from '../media/media.service';
import { StorageService } from 'src/core/storage/storage.service';
import { EmailProviderModule } from '../email-provider/email-provider.module';
import { EmailDispatcherService } from '../email-provider/services/email-dispatcher.service';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => SessionsModule),
    BetterAuthModule.forRootAsync({
      imports: [ConfigModule, DatabaseModule, EmailProviderModule],
      inject: [
        DRIZZLE_DATABASE_CONNECTION,
        ConfigService,
        EmailDispatcherService,
      ],
      disableControllers: true,
      disableGlobalAuthGuard: true,
      useFactory: (
        database: NodePgDatabase<typeof schema>,
        configService: ConfigService<EnvType, true>,
        emailDispatcher: EmailDispatcherService,
      ) => ({
        auth: createAuth(database, configService, emailDispatcher),
        disableTrustedOriginsCors: true,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, MediaService, StorageService],
  exports: [AuthService],
})
export class AuthModule {}
