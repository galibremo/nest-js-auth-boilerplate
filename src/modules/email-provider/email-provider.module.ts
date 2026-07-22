import { forwardRef, Module } from '@nestjs/common';

import { CryptoModule } from '../../core/crypto/crypto.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EmailLogsModule } from '../email-logs/email-logs.module';
import { EmailTemplateModule } from '../email-template/email-template.module';
import { EmailProvidersController } from './email-providers.controller';
import { EmailProvidersRepository } from './email-providers.repository';
import { EmailDispatcherService } from './services/email-dispatcher.service';
import { EmailProvidersService } from './services/email-providers.service';
import { EmailSdkDispatchService } from './services/email-sdk-dispatch.service';

@Module({
	imports: [DatabaseModule, CryptoModule, EmailTemplateModule, forwardRef(() => EmailLogsModule)],
	controllers: [EmailProvidersController],
	providers: [
		EmailProvidersRepository,
		EmailProvidersService,
		EmailSdkDispatchService,
		EmailDispatcherService,
	],
	exports: [EmailDispatcherService, EmailProvidersRepository],
})
export class EmailProviderModule {}
