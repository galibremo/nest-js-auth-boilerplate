import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type { AuthInstance } from '../../../modules/auth/auth.factory';
import schema from '../drizzle/drizzle.schema';
import { users } from '../schema/drizzle/auth.drizzle.schema';

const seedUserData = {
	name: 'Remo',
	email: 'galibremo@gmail.com',
	password: 'Bang@123',
	emailVerified: true,
	role: 'SUPER_ADMIN',
} as const;

export async function seedUser(
	database: NodePgDatabase<typeof schema>,
	auth: AuthInstance,
): Promise<void> {
	const { emailVerified, role, ...signUpData } = seedUserData;

	const existingUser = await database.query.users.findFirst({
		columns: { id: true },
		where: eq(users.email, seedUserData.email),
	});

	if (existingUser) {
		console.log(`User seed skipped: ${seedUserData.email} already exists.`);
		return;
	}

	await auth.api.signUpEmail({
		body: signUpData,
	});

	await database
		.update(users)
		.set({ emailVerified: emailVerified, role: role })
		.where(eq(users.email, seedUserData.email));

	console.log(`User seed created: ${seedUserData.email}`);
}
