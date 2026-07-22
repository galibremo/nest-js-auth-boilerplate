import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../core/database/database.module';
import { EmailProviderModule } from '../email-provider/email-provider.module';
import { EmailLogsController } from './email-logs.controller';
import { EmailLogsRepository } from './email-logs.repository';
import { EmailLogsService } from './email-logs.service';

@Module({
	imports: [DatabaseModule, forwardRef(() => EmailProviderModule)],
	controllers: [EmailLogsController],
	providers: [EmailLogsRepository, EmailLogsService],
	exports: [EmailLogsService],
})
export class EmailLogsModule {}
