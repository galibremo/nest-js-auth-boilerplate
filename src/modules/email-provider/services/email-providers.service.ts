import { Injectable } from '@nestjs/common';

import { CryptoService } from '../../../core/crypto/crypto.service';
import type { EmailProviderSchemaType } from '../../../core/database/drizzle/drizzle.types';
import {
  badGatewayError,
  notFoundError,
} from '../../../core/errors/domain-error';
import {
  canonicalizeEmailProviderType,
  type EmailProviderType,
} from '../email-provider.interface';
import { EmailProvidersPolicy } from '../email-providers.policy';
import { EmailProvidersRepository } from '../email-providers.repository';
import type {
  CreateEmailProviderDto,
  EmailProvidersListQueryDto,
  TestConnectionResponse,
  TestEmailProviderDto,
  UpdateEmailProviderDto,
} from '../schemas/email-providers.schema';
import { parseEmailProviderConfig } from '../schemas/email-providers.schema';
import { EmailSdkDispatchService } from './email-sdk-dispatch.service';

@Injectable()
export class EmailProvidersService {
  constructor(
    private readonly repository: EmailProvidersRepository,
    private readonly cryptoService: CryptoService,
    private readonly emailSdkDispatchService: EmailSdkDispatchService,
  ) {}

  async listProviders(query: EmailProvidersListQueryDto) {
    const result = await this.repository.findAll(query);

    return {
      rows: result.rows.map((row) => this.toResponse(row)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async getProvider(publicId: string) {
    const provider = await this.repository.findByPublicId(publicId);
    if (!provider) {
      throw notFoundError(
        'email_provider_not_found',
        'email provider not found',
      );
    }

    return this.toResponse(provider);
  }

  async createProvider(data: CreateEmailProviderDto) {
    const providerType = data.providerType;
    const parsedConfig = parseEmailProviderConfig(providerType, data.config);
    const encryptedConfig = this.cryptoService.encrypt(
      JSON.stringify(parsedConfig),
    );
    const isFirst = (await this.repository.countActive()) === 0;

    const created = await this.repository.create({
      name: data.name,
      providerType,
      config: encryptedConfig,
      isDefault: isFirst,
      isActive: true,
    });

    if (!created) {
      throw badGatewayError(
        'email_provider_create_failed',
        'Failed to create email provider',
      );
    }

    return this.toResponse(created);
  }

  async updateProvider(publicId: string, data: UpdateEmailProviderDto) {
    const provider = await this.getTargetProvider(publicId);
    const providerType = this.getCanonicalProviderType(provider.providerType);
    const updateData: Partial<typeof provider> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.config !== undefined) {
      const parsedConfig = parseEmailProviderConfig(providerType, data.config);
      updateData.config = this.cryptoService.encrypt(
        JSON.stringify(parsedConfig),
      );
      updateData.providerType = providerType;
    }

    const updated = await this.repository.update(provider.id, updateData);
    if (!updated) {
      throw badGatewayError(
        'email_provider_update_failed',
        'Failed to update email provider',
      );
    }

    return this.toResponse(updated);
  }

  async deleteProvider(publicId: string) {
    const provider = await this.getTargetProvider(publicId);
    const activeCount = await this.repository.countActive();

    EmailProvidersPolicy.assertCanDelete(provider, activeCount);

    const deleted = await this.repository.delete(provider.id);
    if (!deleted) {
      throw badGatewayError(
        'email_provider_delete_failed',
        'Failed to delete email provider',
      );
    }

    return { deleted: true };
  }

  async setDefault(publicId: string) {
    const provider = await this.getTargetProvider(publicId);

    EmailProvidersPolicy.assertCanSetDefault(provider);

    await this.repository.clearAllDefaults(provider.id);

    const updated = await this.repository.update(provider.id, {
      isDefault: true,
    });
    if (!updated) {
      throw badGatewayError(
        'email_provider_set_default_failed',
        'Failed to set default email provider',
      );
    }

    return this.toResponse(updated);
  }

  async toggleProvider(publicId: string) {
    const provider = await this.getTargetProvider(publicId);

    const updated = await this.repository.update(provider.id, {
      isActive: !provider.isActive,
    });
    if (!updated) {
      throw badGatewayError(
        'email_provider_toggle_failed',
        'Failed to toggle email provider',
      );
    }

    return this.toResponse(updated);
  }

  async testConnection(
    publicId: string,
    data: TestEmailProviderDto,
  ): Promise<TestConnectionResponse> {
    const provider = await this.getTargetProvider(publicId);
    const providerType = this.getCanonicalProviderType(provider.providerType);

    try {
      await this.emailSdkDispatchService.sendWithProvider(
        provider,
        {
          to: data.to,
          subject: data.subject ?? 'Onedesk Pro email provider test',
          text: data.text ?? 'This is a smoke test email from Onedesk Pro.',
          html: data.html,
          idempotencyKey: `email-provider-test:${provider.publicId}:${Date.now()}`,
          metadata: {
            smokeTest: true,
            providerId: provider.publicId,
            providerType,
          },
        },
        { smokeTest: true },
      );

      await this.updateTestStatus(provider.id, 'success');

      return { success: true, message: 'Smoke email sent successfully' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      await this.updateTestStatus(provider.id, 'failed');

      return { success: false, message: `Smoke email failed: ${message}` };
    }
  }

  async getAllActiveProviders(): Promise<EmailProviderSchemaType[]> {
    return this.repository.findAllActive();
  }

  async getDefaultActiveProvider(): Promise<
    EmailProviderSchemaType | undefined
  > {
    return this.repository.findDefaultActive();
  }

  private async getTargetProvider(
    publicId: string,
  ): Promise<EmailProviderSchemaType> {
    const provider = await this.repository.findByPublicId(publicId);
    if (!provider) {
      throw notFoundError(
        'email_provider_not_found',
        'email provider not found',
      );
    }
    return provider;
  }

  private async updateTestStatus(
    id: number,
    status: 'success' | 'failed',
  ): Promise<void> {
    await this.repository.updateTestStatus(id, status, new Date());
  }

  private toResponse(provider: EmailProviderSchemaType) {
    const decryptedConfig = JSON.parse(
      this.cryptoService.decrypt(provider.config),
    ) as Record<string, unknown>;

    return {
      id: provider.publicId,
      name: provider.name,
      providerType: this.getCanonicalProviderType(provider.providerType),
      config: this.maskConfig(decryptedConfig),
      isDefault: provider.isDefault,
      isActive: provider.isActive,
      lastTestedAt: provider.lastTestedAt?.toISOString() ?? null,
      lastTestStatus: provider.lastTestStatus ?? null,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    };
  }

  private getCanonicalProviderType(providerType: string): EmailProviderType {
    const canonicalType = canonicalizeEmailProviderType(providerType);
    if (!canonicalType) {
      throw badGatewayError(
        'email_provider_type_unsupported',
        'email provider type is unsupported',
        {
          providerType,
        },
      );
    }
    return canonicalType;
  }

  private maskConfig(config: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...config };
    const sensitiveFields = [
      'apiKey',
      'apiToken',
      'token',
      'serverToken',
      'secretAccessKey',
      'secretKey',
      'sessionToken',
      'pass',
      'headers',
    ];

    for (const field of sensitiveFields) {
      if (field in masked) {
        masked[field] = '********';
      }
    }

    if (
      masked.auth &&
      typeof masked.auth === 'object' &&
      'pass' in (masked.auth as Record<string, unknown>)
    ) {
      masked.auth = {
        ...(masked.auth as Record<string, unknown>),
        pass: '********',
      };
    }

    return masked;
  }
}
