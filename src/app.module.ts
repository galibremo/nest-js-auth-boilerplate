import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './core/validators/env';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './core/database/database.module';
import { CryptoModule } from './core/crypto/crypto.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from './shared/pipes/zod-validation.pipe';
import { AuthModule } from './modules/auth/auth.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { EmailLogsModule } from './modules/email-logs/email-logs.module';
import { EmailProviderModule } from './modules/email-provider/email-provider.module';
import { EmailTemplateModule } from './modules/email-template/email-template.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    CryptoModule,
    AuthModule,
    SessionsModule,
    UsersModule,
    EmailLogsModule,
    EmailProviderModule,
    EmailTemplateModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
