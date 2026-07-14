import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import createDrizzleConnection from './drizzle/drizzle.connection';
import { DRIZZLE_DATABASE_CONNECTION } from './drizzle/drizzle.tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) =>
        createDrizzleConnection(configService),
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE_DATABASE_CONNECTION],
})
export class DatabaseModule {}
