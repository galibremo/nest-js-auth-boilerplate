import { forbiddenError } from '../../core/errors/domain-error';

export class UsersPolicy {
  static assertCanManageUser(actor: CurrentUser, target: CurrentUser): void {
    if (String(actor.id) === String(target.id)) {
      throw forbiddenError(
        'forbidden',
        'You cannot manage your own user account here.',
      );
    }
  }
}
