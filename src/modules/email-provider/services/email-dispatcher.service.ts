import { Injectable, Logger } from '@nestjs/common';

import type {
  TemplateKey,
  TemplateVariableMap,
} from '../../email-template/email-template.registry';
import { EmailTemplateService } from '../../email-template/email-template.service';
import type { SendEmailParams } from '../email-provider.interface';
import { EmailSdkDispatchService } from './email-sdk-dispatch.service';
import { EmailProvidersService } from './email-providers.service';

@Injectable()
export class EmailDispatcherService {
  private readonly logger = new Logger(EmailDispatcherService.name);

  constructor(
    private readonly emailProvidersService: EmailProvidersService,
    private readonly templateService: EmailTemplateService,
    private readonly emailSdkDispatchService: EmailSdkDispatchService,
  ) {}

  async sendEmail(
    params: SendEmailParams,
    templateKey?: string,
  ): Promise<void> {
    const defaultProvider =
      await this.emailProvidersService.getDefaultActiveProvider();

    if (!defaultProvider) {
      this.logger.warn(
        '[EmailDispatcher] No active default email provider configured - email not sent',
      );
      return;
    }

    await this.emailSdkDispatchService.sendWithProvider(
      defaultProvider,
      params,
      { templateKey },
    );
    this.logger.log(
      `[EmailDispatcher] Email sent through default provider "${defaultProvider.name}"`,
    );
  }

  async sendFromTemplate<K extends string>(params: {
    templateKey: K;
    to: { email: string; name?: string }[];
    params: K extends TemplateKey
      ? TemplateVariableMap[K]
      : Record<string, unknown>;
    replyTo?: { email: string; name?: string };
    headers?: Record<string, string>;
    metadata?: SendEmailParams['metadata'];
    idempotencyKey?: string;
  }): Promise<void> {
    const rendered = await this.templateService.render(
      params.templateKey,
      params.params,
    );

    await this.sendEmail(
      {
        to: params.to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: params.replyTo,
        headers: {
          ...params.headers,
          'X-Template-Version': String(rendered.version),
        },
        metadata: params.metadata,
        idempotencyKey: params.idempotencyKey,
      },
      params.templateKey,
    );
  }
}
