import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SessionsController } from './sessions.controller';
import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository],
  exports: [SessionsRepository],
})
export class SessionsModule {}
