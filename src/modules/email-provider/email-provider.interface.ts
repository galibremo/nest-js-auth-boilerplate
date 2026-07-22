import type {
  EmailAddress,
  EmailAttachment,
  EmailHeader,
  EmailMessage,
  EmailTag,
} from '@opencoredev/email-sdk';
import type { BrevoProviderOptions } from '@opencoredev/email-sdk/brevo';
import type { CloudflareProviderOptions } from '@opencoredev/email-sdk/cloudflare';
import type { IterableProviderOptions } from '@opencoredev/email-sdk/iterable';
import type { JetemailProviderOptions } from '@opencoredev/email-sdk/jetemail';
import type { LettermintProviderOptions } from '@opencoredev/email-sdk/lettermint';
import type { LoopsProviderOptions } from '@opencoredev/email-sdk/loops';
import type { MailchimpProviderOptions } from '@opencoredev/email-sdk/mailchimp';
import type { MailerSendProviderOptions } from '@opencoredev/email-sdk/mailersend';
import type { MailgunProviderOptions } from '@opencoredev/email-sdk/mailgun';
import type { MailPaceProviderOptions } from '@opencoredev/email-sdk/mailpace';
import type { MailtrapProviderOptions } from '@opencoredev/email-sdk/mailtrap';
import type { PlunkProviderOptions } from '@opencoredev/email-sdk/plunk';
import type { PostmarkProviderOptions } from '@opencoredev/email-sdk/postmark';
import type { PrimitiveProviderOptions } from '@opencoredev/email-sdk/primitive';
import type { ResendProviderOptions } from '@opencoredev/email-sdk/resend';
import type { ScalewayProviderOptions } from '@opencoredev/email-sdk/scaleway';
import type { SendGridProviderOptions } from '@opencoredev/email-sdk/sendgrid';
import type { SequenzyProviderOptions } from '@opencoredev/email-sdk/sequenzy';
import type { SesProviderOptions } from '@opencoredev/email-sdk/ses';
import type { SmtpProviderOptions as EmailServerProviderOptions } from '@opencoredev/email-sdk/smtp';
import type { SparkPostProviderOptions } from '@opencoredev/email-sdk/sparkpost';
import type { UnosendProviderOptions } from '@opencoredev/email-sdk/unosend';
import type { ZeptoMailProviderOptions } from '@opencoredev/email-sdk/zeptomail';

export const EMAIL_PROVIDER_TYPES = [
  'resend',
  'postmark',
  'sendgrid',
  'cloudflare',
  'unosend',
  'iterable',
  'ses',
  'mailgun',
  'mailersend',
  'brevo',
  'mailchimp',
  'sparkpost',
  'loops',
  'sequenzy',
  'jetemail',
  'lettermint',
  'primitive',
  'plunk',
  'mailtrap',
  'scaleway',
  'zeptomail',
  'mailpace',
  'email',
] as const;

export type EmailProviderType = (typeof EMAIL_PROVIDER_TYPES)[number];
export type LegacyEmailProviderType = 'nodemailer' | 'aws-ses' | 'smtp';
export type StoredEmailProviderType =
  EmailProviderType | LegacyEmailProviderType;

export const LEGACY_EMAIL_PROVIDER_TYPE_ALIASES: Record<
  LegacyEmailProviderType,
  EmailProviderType
> = {
  nodemailer: 'email',
  'aws-ses': 'ses',
  smtp: 'email',
};

export interface ProviderSenderConfig {
  senderEmail: string;
  senderName: string;
}

type SerializableAdapterOptions<T> = Omit<T, 'fetch'>;
type WithSender<T> = SerializableAdapterOptions<T> & ProviderSenderConfig;

export interface EmailProviderConfigMap {
  resend: WithSender<ResendProviderOptions>;
  postmark: WithSender<PostmarkProviderOptions>;
  sendgrid: WithSender<SendGridProviderOptions>;
  cloudflare: WithSender<CloudflareProviderOptions>;
  unosend: WithSender<UnosendProviderOptions>;
  iterable: WithSender<IterableProviderOptions>;
  ses: WithSender<SesProviderOptions>;
  mailgun: WithSender<MailgunProviderOptions>;
  mailersend: WithSender<MailerSendProviderOptions>;
  brevo: WithSender<BrevoProviderOptions>;
  mailchimp: WithSender<MailchimpProviderOptions>;
  sparkpost: WithSender<SparkPostProviderOptions>;
  loops: WithSender<LoopsProviderOptions>;
  sequenzy: WithSender<SequenzyProviderOptions>;
  jetemail: WithSender<JetemailProviderOptions>;
  lettermint: WithSender<LettermintProviderOptions>;
  primitive: WithSender<PrimitiveProviderOptions>;
  plunk: WithSender<PlunkProviderOptions>;
  mailtrap: WithSender<MailtrapProviderOptions>;
  scaleway: WithSender<ScalewayProviderOptions>;
  zeptomail: WithSender<ZeptoMailProviderOptions>;
  mailpace: WithSender<MailPaceProviderOptions>;
  email: WithSender<SerializableAdapterOptions<EmailServerProviderOptions>>;
}

export type EmailProviderConfig = EmailProviderConfigMap[EmailProviderType];

export interface SendEmailParams {
  to: EmailMessage['to'];
  subject: string;
  html?: string;
  text?: string;
  htmlContent?: string;
  textContent?: string;
  cc?: EmailMessage['cc'];
  bcc?: EmailMessage['bcc'];
  replyTo?: EmailMessage['replyTo'];
  headers?: Record<string, string> | EmailHeader[];
  attachments?: EmailAttachment[];
  tags?: EmailTag[];
  metadata?: EmailMessage['metadata'];
  idempotencyKey?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export function canonicalizeEmailProviderType(
  type: string,
): EmailProviderType | null {
  if ((EMAIL_PROVIDER_TYPES as readonly string[]).includes(type)) {
    return type as EmailProviderType;
  }

  return (
    LEGACY_EMAIL_PROVIDER_TYPE_ALIASES[type as LegacyEmailProviderType] ?? null
  );
}

export function isEmailAddressObject(
  address: EmailAddress,
): address is { email: string; name?: string } {
  return typeof address === 'object' && address !== null && 'email' in address;
}
