import type { TemplateVariableDescriptor, TemplateKey } from '../../../modules/email-template/email-template.registry';
import { TEMPLATE_KEYS } from '../../../modules/email-template/email-template.registry';

export interface EmailTemplateSeedItem {
    key: TemplateKey;
    subject: string;
    html: string;
    text: string;
    variables: TemplateVariableDescriptor[];
}

const EMAIL_BG = '#030712';
const CARD_BG = '#121216';
const BORDER_COLOR = '#1a1a22';
const PRIMARY = '#10b981';
const HEADING_TEXT = '#f3f4f6';
const BODY_TEXT = '#e5e7eb';
const MUTED_TEXT = '#d1d5db';
const APP_NAME = 'Onedesk Pro';
const COMPANY_NAME = 'Typetech It';
const COMPANY_ADDRESS = 'Mirpur DOHS, Dhaka';

function wrapHtml(content: string): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="https://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>${APP_NAME}</title>
<!--[if gte mso 9]>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BG};font-family:'Plus Jakarta Sans','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${EMAIL_BG};min-width:100%;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
<tr><td align="center" style="padding:0 0 32px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:0 8px 0 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="8" height="8"><tr><td style="width:8px;height:8px;background-color:${PRIMARY};border-radius:50%;"></td></tr></table></td>
<td><span style="font-size:22px;font-weight:700;color:${HEADING_TEXT};letter-spacing:-0.3px;">${APP_NAME}</span></td>
</tr>
</table>
</td></tr>
<tr><td style="background-color:${CARD_BG};border-radius:12px;border:1px solid ${BORDER_COLOR};padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding:40px 40px 0 40px;" align="left">
${content}
</td></tr>
<tr><td style="padding:32px 40px 32px 40px;border-top:1px solid ${BORDER_COLOR};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td align="left" style="font-size:12px;color:${MUTED_TEXT};line-height:18px;">
&copy; {{year}} ${COMPANY_NAME}. All rights reserved.<br>
${COMPANY_ADDRESS}
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:24px 0 0 0;font-size:12px;color:${MUTED_TEXT};line-height:18px;">
If you have any questions, contact us at <a href="mailto:info@typetechit.com" style="color:${PRIMARY};text-decoration:none;">info@typetechit.com</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buttonHtml(text: string, url: string): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0 0;">
<tr>
<td align="center" style="border-radius:8px;background-color:${PRIMARY};">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">${text}</a>
</td>
</tr>
</table>`;
}

function headingHtml(text: string): string {
    return `<h1 style="margin:0 0 12px 0;font-size:24px;font-weight:700;color:${HEADING_TEXT};letter-spacing:-0.3px;line-height:1.3;">${text}</h1>`;
}

function bodyHtml(text: string): string {
    return `<p style="margin:0 0 12px 0;font-size:15px;color:${BODY_TEXT};line-height:1.6;">${text}</p>`;
}

function dividerHtml(): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;"><tr><td style="height:1px;background-color:${BORDER_COLOR};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

export const EMAIL_TEMPLATE_SEED_DATA: EmailTemplateSeedItem[] = [
    // ── Auth: Welcome ──────────────────────────────────────────────
    {
        key: TEMPLATE_KEYS.AUTH_WELCOME,
        subject: 'Welcome to ' + APP_NAME + ', {{name}}!',
        html: wrapHtml(`
${headingHtml('Welcome to ' + APP_NAME + ', {{name}}!')}
${bodyHtml('We\'re thrilled to have you on board. Your account has been successfully created and you\'re now ready to explore everything ' + APP_NAME + ' has to offer.')}
${bodyHtml('Get started by logging in and setting up your profile. You can create workspaces, invite team members, and start managing your conversations right away.')}
${buttonHtml('Go to Dashboard', '{{appUrl}}')}
${dividerHtml()}
${bodyHtml('If you have any questions, feel free to reply to this email or contact our support team. We\'re here to help!')}
		`),
        text: `Welcome to ${APP_NAME}, {{name}}!

We're thrilled to have you on board. Your account has been successfully created and you're now ready to explore everything ${APP_NAME} has to offer.

Get started by logging in and setting up your profile: {{appUrl}}

If you have any questions, feel free to reply to this email or contact our support team.

---
© {{year}} ${COMPANY_NAME} | ${COMPANY_ADDRESS}`,
        variables: [
            { name: 'name', type: 'string', required: true, description: 'Recipient display name' },
            { name: 'email', type: 'string', required: true, description: 'Recipient email address' },
            { name: 'appUrl', type: 'string', required: false, description: 'Application URL' },
            { name: 'year', type: 'number', required: true, description: 'Current year for footer copyright' },
        ],
    },

    // ── Auth: Magic Link ───────────────────────────────────────────
    {
        key: TEMPLATE_KEYS.AUTH_MAGIC_LINK,
        subject: 'Sign in to ' + APP_NAME + ' — Magic Link',
        html: wrapHtml(`
${headingHtml('Your Magic Link')}
${bodyHtml('You requested a magic link to sign in to your ' + APP_NAME + ' account. Click the button below to securely sign in.')}
${buttonHtml('Sign In', '{{verificationUrl}}')}
${bodyHtml('This link will expire in <strong>{{expiresInMinutes}} minutes</strong>. If you didn\'t request this link, you can safely ignore this email.')}
${dividerHtml()}
${bodyHtml('After signing in, you\'ll be redirected to: {{redirectUrl}}')}
		`),
        text: `Your Magic Link

You requested a magic link to sign in to your ${APP_NAME} account. Use the link below to securely sign in:

{{verificationUrl}}

This link will expire in {{expiresInMinutes}} minutes. If you didn't request this link, you can safely ignore this email.

After signing in, you'll be redirected to: {{redirectUrl}}

---
© {{year}} ${COMPANY_NAME} | ${COMPANY_ADDRESS}`,
        variables: [
            { name: 'verificationUrl', type: 'string', required: true, description: 'Magic link verification URL' },
            { name: 'redirectUrl', type: 'string', required: true, description: 'URL to redirect after verification' },
            { name: 'expiresInMinutes', type: 'number', required: true, description: 'Link expiration time in minutes' },
            { name: 'year', type: 'number', required: true, description: 'Current year for footer copyright' },
        ],
    },

    // ── Auth: Invitation ───────────────────────────────────────────
    {
        key: TEMPLATE_KEYS.AUTH_INVITATION,
        subject: 'You\'re invited to join ' + APP_NAME,
        html: wrapHtml(`
${headingHtml('You\'re Invited!')}
${bodyHtml('Hi {{name}},')}
${bodyHtml('{{createdByName}} has invited you to join ' + APP_NAME + ' with the role of <strong>{{role}}</strong>.')}
${bodyHtml('Click the button below to create your account and get started.')}
${buttonHtml('Accept Invitation', '{{appUrl}}')}
${dividerHtml()}
${bodyHtml('If you have any questions about this invitation, please reach out to {{createdByName}} directly.')}
		`),
        text: `You're Invited!

Hi {{name}},

{{createdByName}} has invited you to join ${APP_NAME} with the role of {{role}}.

Create your account here: {{appUrl}}

If you have any questions about this invitation, please reach out to {{createdByName}} directly.

---
© {{year}} ${COMPANY_NAME} | ${COMPANY_ADDRESS}`,
        variables: [
            { name: 'name', type: 'string', required: true, description: 'Recipient display name' },
            { name: 'role', type: 'string', required: true, description: 'Assigned role (SUPER_ADMIN, ADMIN, MANAGER, USER)' },
            { name: 'createdByName', type: 'string', required: true, description: 'Name of the admin who created the invitation' },
            { name: 'appUrl', type: 'string', required: true, description: 'Application URL' },
            { name: 'year', type: 'number', required: true, description: 'Current year for footer copyright' },
        ],
    },

    // ── Auth: Account Approval ─────────────────────────────────────
    {
        key: TEMPLATE_KEYS.AUTH_ACCOUNT_APPROVAL,
        subject: 'Your ' + APP_NAME + ' account has been approved',
        html: wrapHtml(`
${headingHtml('Account Approved')}
${bodyHtml('Hi {{name}},')}
${bodyHtml('Great news! Your ' + APP_NAME + ' account has been approved by <strong>{{approvedByName}}</strong>.')}
${bodyHtml('You now have full access to the platform. Log in to start managing your workflows and collaborating with your team.')}
${buttonHtml('Go to ' + APP_NAME, '{{appUrl}}')}
${dividerHtml()}
${bodyHtml('Welcome aboard — we\'re excited to see what you\'ll build!')}
		`),
        text: `Account Approved

Hi {{name}},

Great news! Your ${APP_NAME} account has been approved by {{approvedByName}}.

You now have full access to the platform. Log in here: {{appUrl}}

Welcome aboard — we're excited to see what you'll build!

---
© {{year}} ${COMPANY_NAME} | ${COMPANY_ADDRESS}`,
        variables: [
            { name: 'name', type: 'string', required: true, description: 'Recipient display name' },
            { name: 'approvedByName', type: 'string', required: true, description: 'Name of the admin who approved the account' },
            { name: 'appUrl', type: 'string', required: true, description: 'Application URL' },
            { name: 'year', type: 'number', required: true, description: 'Current year for footer copyright' },
        ],
    },

    // ── Chat: New Message ──────────────────────────────────────────
    {
        key: TEMPLATE_KEYS.CHAT_NEW_MESSAGE,
        subject: 'New message from {{senderName}} on ' + APP_NAME,
        html: wrapHtml(`
${headingHtml('New Message')}
${bodyHtml('Hi {{name}},')}
${bodyHtml('You have a new message from <strong>{{senderName}}</strong> in <strong>{{conversationTitle}}</strong>.')}
<div style="margin:16px 0;padding:16px;background-color:${EMAIL_BG};border-radius:8px;border:1px solid ${BORDER_COLOR};font-size:14px;color:${BODY_TEXT};line-height:1.5;font-style:italic;">
&ldquo;{{messagePreview}}&rdquo;
</div>
${buttonHtml('View Message', '{{appUrl}}')}
		`),
        text: `New Message

Hi {{name}},

You have a new message from {{senderName}} in {{conversationTitle}}.

"{{messagePreview}}"

View Message: {{appUrl}}

---
© {{year}} ${COMPANY_NAME} | ${COMPANY_ADDRESS}`,
        variables: [
            { name: 'name', type: 'string', required: true, description: 'Recipient display name' },
            { name: 'senderName', type: 'string', required: true, description: 'Name of the message sender' },
            { name: 'conversationTitle', type: 'string', required: true, description: 'Title of the conversation' },
            { name: 'messagePreview', type: 'string', required: true, description: 'Preview text of the message' },
            { name: 'appUrl', type: 'string', required: true, description: 'Application URL' },
            { name: 'year', type: 'number', required: true, description: 'Current year for footer copyright' },
        ],
    },

    // ── Chat: Mention ──────────────────────────────────────────────
    {
        key: TEMPLATE_KEYS.CHAT_MENTION,
        subject: 'You were mentioned in {{conversationTitle}} on ' + APP_NAME,
        html: wrapHtml(`
${headingHtml('You Were Mentioned')}
${bodyHtml('Hi {{name}},')}
${bodyHtml('<strong>{{mentionedByName}}</strong> mentioned you in a message in <strong>{{conversationTitle}}</strong>.')}
<div style="margin:16px 0;padding:16px;background-color:${EMAIL_BG};border-radius:8px;border:1px solid ${BORDER_COLOR};font-size:14px;color:${BODY_TEXT};line-height:1.5;font-style:italic;">
&ldquo;{{messagePreview}}&rdquo;
</div>
${buttonHtml('View Conversation', '{{appUrl}}')}
${dividerHtml()}
${bodyHtml('Mention notifications help you stay on top of conversations that need your attention.')}
		`),
        text: `You Were Mentioned

Hi {{name}},

{{mentionedByName}} mentioned you in a message in {{conversationTitle}}.

"{{messagePreview}}"

View Conversation: {{appUrl}}

Mention notifications help you stay on top of conversations that need your attention.

---
© {{year}} ${COMPANY_NAME} | ${COMPANY_ADDRESS}`,
        variables: [
            { name: 'name', type: 'string', required: true, description: 'Recipient display name' },
            { name: 'mentionedByName', type: 'string', required: true, description: 'Name of the person who mentioned the recipient' },
            { name: 'conversationTitle', type: 'string', required: true, description: 'Title of the conversation' },
            { name: 'messagePreview', type: 'string', required: true, description: 'Preview text of the message' },
            { name: 'appUrl', type: 'string', required: true, description: 'Application URL' },
            { name: 'year', type: 'number', required: true, description: 'Current year for footer copyright' },
        ],
    },
];
