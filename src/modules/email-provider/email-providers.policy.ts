import type { EmailProviderSchemaType } from '../../core/database/drizzle/drizzle.types';
import { forbiddenError } from '../../core/errors/domain-error';

export class EmailProvidersPolicy {
  static assertCanDelete(
    provider: EmailProviderSchemaType,
    activeCount: number,
  ): void {
    if (!provider.isActive && activeCount === 0) {
      return;
    }

    if (activeCount <= 1 && provider.isActive) {
      throw forbiddenError(
        'cannot_delete_last_active_provider',
        'Cannot delete the only active email provider. Deactivate it first or add another provider.',
      );
    }
  }

  static assertCanSetDefault(provider: EmailProviderSchemaType): void {
    if (!provider.isActive) {
      throw forbiddenError(
        'cannot_set_inactive_default',
        'Cannot set an inactive provider as default. Activate it first.',
      );
    }
  }
}
