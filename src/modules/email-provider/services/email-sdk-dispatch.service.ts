import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailAddress,
  EmailMessage,
  EmailProviderResponse,
} from '@opencoredev/email-sdk';

import { CryptoService } from '../../../core/crypto/crypto.service';
import type { EmailProviderSchemaType } from '../../../core/database/drizzle/drizzle.types';
import {
  badGatewayError,
  unprocessableError,
  type DomainErrorMeta,
} from '../../../core/errors/domain-error';
import { EmailLogsService } from '../../email-logs/email-logs.service';
import { createEmailSdkProvider } from '../email-provider-sdk-adapter.factory';
import { importEmailSdkModule } from '../email-sdk-runtime-loader';
import {
  canonicalizeEmailProviderType,
  isEmailAddressObject,
  type SendEmailParams,
} from '../email-provider.interface';
import { parseEmailProviderConfig } from '../schemas/email-providers.schema';

interface DispatchOptions {
  templateKey?: string;
  smokeTest?: boolean;
}

@Injectable()
export class EmailSdkDispatchService {
  private readonly logger = new Logger(EmailSdkDispatchService.name);

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly emailLogsService: EmailLogsService,
  ) {}

  async sendWithProvider(
    providerRecord: EmailProviderSchemaType,
    params: SendEmailParams,
    options: DispatchOptions = {},
  ): Promise<EmailProviderResponse> {
    const emailSdk = await importEmailSdkModule('@opencoredev/email-sdk');
    const providerType = canonicalizeEmailProviderType(
      providerRecord.providerType,
    );

    if (!providerType) {
      throw badGatewayError(
        'email_provider_type_unsupported',
        'Email provider type is unsupported',
        {
          providerType: providerRecord.providerType,
          providerId: providerRecord.publicId,
        },
      );
    }

    const recipients = this.normalizeRecipients(params.to);
    const idempotencyKey =
      params.idempotencyKey ??
      `email-provider:${providerRecord.publicId}:${options.templateKey ?? 'raw'}:${randomUUID()}`;

    try {
      const decryptedConfig = JSON.parse(
        this.cryptoService.decrypt(providerRecord.config),
      ) as Record<string, unknown>;
      const config = parseEmailProviderConfig(providerType, decryptedConfig);
      const message = this.buildEmailMessage(
        config.senderEmail,
        config.senderName,
        params,
        idempotencyKey,
      );
      const sdkProvider = await createEmailSdkProvider(
        providerType,
        config,
        providerRecord.publicId,
      );
      const client = emailSdk.createEmailClient({
        adapters: [sdkProvider],
        defaultAdapter: sdkProvider.name,
        retry: { retries: 1 },
        hooks: {
          onRetry: (event) => {
            this.logger.warn(
              `[EmailSdkDispatch] Retry scheduled for provider "${providerRecord.name}" (${providerType}) attempt ${event.nextAttempt}`,
            );
          },
        },
      });

      const response = await client.send(message, {
        adapter: sdkProvider.name,
        fallbackAdapters: [],
        retries: 1,
        idempotencyKey,
        metadata: {
          providerId: providerRecord.publicId,
          providerType,
          templateKey: options.templateKey,
          smokeTest: options.smokeTest ?? false,
        },
      });

      await this.logSendResults(
        providerRecord,
        recipients,
        params,
        options,
        'sent',
        undefined,
        {
          providerType,
          sdkProvider: response.provider,
          messageId: response.messageId ?? response.id ?? null,
          idempotencyKey,
        },
      );

      return response;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);

      await this.logSendResults(
        providerRecord,
        recipients,
        params,
        options,
        'failed',
        errorMessage,
        {
          providerType,
          idempotencyKey,
          ...this.getSdkErrorMeta(error, emailSdk.EmailSdkError),
        },
      );

      throw badGatewayError(
        'email_send_failed',
        'Failed to send email through the configured provider',
        {
          providerType,
          providerId: providerRecord.publicId,
          retryable:
            error instanceof emailSdk.EmailSdkError
              ? error.retryable
              : undefined,
          error: errorMessage,
        },
      );
    }
  }

  private buildEmailMessage(
    senderEmail: string,
    senderName: string,
    params: SendEmailParams,
    idempotencyKey: string,
  ): EmailMessage {
    const html = params.html ?? params.htmlContent;
    const text = params.text ?? params.textContent;

    if (!html && !text) {
      throw unprocessableError(
        'email_content_missing',
        'Email requires either HTML content or text content',
      );
    }

    return {
      from: { email: senderEmail, name: senderName },
      to: params.to,
      subject: params.subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(params.cc ? { cc: params.cc } : {}),
      ...(params.bcc ? { bcc: params.bcc } : {}),
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      ...(params.headers ? { headers: params.headers } : {}),
      ...(params.attachments ? { attachments: params.attachments } : {}),
      ...(params.tags ? { tags: params.tags } : {}),
      ...(params.metadata ? { metadata: params.metadata } : {}),
      idempotencyKey,
    };
  }

  private normalizeRecipients(
    to: EmailMessage['to'],
  ): { email: string; name?: string }[] {
    const recipients = Array.isArray(to) ? to : [to];

    return recipients.map((recipient) => this.normalizeRecipient(recipient));
  }

  private normalizeRecipient(recipient: EmailAddress): {
    email: string;
    name?: string;
  } {
    if (isEmailAddressObject(recipient)) {
      return { email: recipient.email, name: recipient.name };
    }

    return { email: recipient };
  }

  private async logSendResults(
    providerRecord: EmailProviderSchemaType,
    recipients: { email: string; name?: string }[],
    params: SendEmailParams,
    options: DispatchOptions,
    status: 'sent' | 'failed',
    errorMessage?: string,
    metadata?: DomainErrorMeta,
  ): Promise<void> {
    for (const recipient of recipients) {
      await this.emailLogsService.createLog({
        emailProviderId: providerRecord.id,
        toEmail: recipient.email,
        toName: recipient.name,
        subject: params.subject,
        templateKey: options.templateKey,
        status,
        errorMessage,
        metadata: {
          ...(params.metadata ?? {}),
          ...(metadata ?? {}),
          smokeTest: options.smokeTest ?? false,
        },
      });
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  private getSdkErrorMeta(
    error: unknown,
    EmailSdkErrorClass: typeof import('@opencoredev/email-sdk').EmailSdkError,
  ): DomainErrorMeta {
    if (!(error instanceof EmailSdkErrorClass)) {
      return {};
    }

    return {
      sdkCode: error.code,
      sdkProvider: error.provider ?? null,
      sdkStatus: error.status ?? null,
      retryable: error.retryable,
    };
  }
}
