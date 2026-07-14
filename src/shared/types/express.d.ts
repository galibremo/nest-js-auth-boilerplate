import type { UserSchemaType } from '../../core/database/drizzle/drizzle.types';

declare global {
	namespace Express {
		type User = UserSchemaType;

		interface Request {
			user?: User;
		}
	}
}
