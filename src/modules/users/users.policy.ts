import { forbiddenError } from '../../core/errors/domain-error';

export class UsersPolicy {
  static assertCanManageUser(actor: CurrentUser, target: CurrentUser): void {
    if (String(actor.id) === String(target.id)) {
      throw forbiddenError(
        'forbidden',
        'You cannot manage your own user account here.',
      );
    }

    if (actor.role === 'SUPER_ADMIN') return;

    throw forbiddenError(
      'forbidden',
      "You don't have permission to manage this user.",
    );
  }

  static assertCanAssignRole(actor: CurrentUser): void {
    if (actor.role === 'SUPER_ADMIN') return;

    throw forbiddenError(
      'forbidden',
      "You don't have permission to assign this role.",
    );
  }
}
