import { unauthorizedError } from '../../core/errors/domain-error';

export class MediaPolicy {
	static assertCanUpload(actor?: CurrentUser): void {
		if (!actor) {
			throw unauthorizedError('You must be logged in to upload media.');
		}
	}
}
