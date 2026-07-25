import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { EmailTemplateRepository } from '../../../modules/email-template/email-template.repository';
import schema from '../drizzle/drizzle.schema';
import { emailTemplates } from '../schema/drizzle/email.drizzle.schema';
import { EMAIL_TEMPLATE_SEED_DATA } from './email-template-data';

export async function seedEmailTemplates(
    database: NodePgDatabase<typeof schema>,
): Promise<void> {
    const templateRepo = new EmailTemplateRepository(database);
    let created = 0;
    let skipped = 0;

    for (const item of EMAIL_TEMPLATE_SEED_DATA) {
        const existing = await database
            .select({ id: emailTemplates.id })
            .from(emailTemplates)
            .where(eq(emailTemplates.key, item.key))
            .limit(1);

        if (existing.length > 0) {
            console.log(`Email template seed skipped: "${item.key}" already exists.`);
            skipped++;
            continue;
        }

        await templateRepo.create({
            key: item.key,
            subject: item.subject,
            html: item.html,
            text: item.text,
            variables: item.variables,
            version: 1,
            isActive: true,
        });

        console.log(`Email template seed created: "${item.key}"`);
        created++;
    }

    console.log(`Email template seeding complete: ${created} created, ${skipped} skipped.`);
}
