import type { EmailProvider as EmailSdkProvider } from '@opencoredev/email-sdk';

import type {
  EmailProviderType,
  EmailProviderConfig,
  EmailProviderConfigMap,
} from './email-provider.interface';
import { importEmailSdkModule } from './email-sdk-runtime-loader';

export async function createEmailSdkProvider(
  providerType: EmailProviderType,
  config: EmailProviderConfig,
  adapterName: string,
): Promise<EmailSdkProvider> {
  switch (providerType) {
    case 'resend': {
      const options = omitSender(config as EmailProviderConfigMap['resend']);
      const { resend } = await importEmailSdkModule(
        '@opencoredev/email-sdk/resend',
      );
      return renameProvider(resend(options), adapterName);
    }
    case 'postmark': {
      const options = omitSender(config as EmailProviderConfigMap['postmark']);
      const { postmark } = await importEmailSdkModule(
        '@opencoredev/email-sdk/postmark',
      );
      return renameProvider(postmark(options), adapterName);
    }
    case 'sendgrid': {
      const options = omitSender(config as EmailProviderConfigMap['sendgrid']);
      const { sendgrid } = await importEmailSdkModule(
        '@opencoredev/email-sdk/sendgrid',
      );
      return renameProvider(sendgrid(options), adapterName);
    }
    case 'cloudflare': {
      const options = omitSender(
        config as EmailProviderConfigMap['cloudflare'],
      );
      const { cloudflare } = await importEmailSdkModule(
        '@opencoredev/email-sdk/cloudflare',
      );
      return renameProvider(cloudflare(options), adapterName);
    }
    case 'unosend': {
      const options = omitSender(config as EmailProviderConfigMap['unosend']);
      const { unosend } = await importEmailSdkModule(
        '@opencoredev/email-sdk/unosend',
      );
      return renameProvider(unosend(options), adapterName);
    }
    case 'iterable': {
      const options = omitSender(config as EmailProviderConfigMap['iterable']);
      const { iterable } = await importEmailSdkModule(
        '@opencoredev/email-sdk/iterable',
      );
      return renameProvider(iterable(options), adapterName);
    }
    case 'ses': {
      const options = omitSender(config as EmailProviderConfigMap['ses']);
      const { ses } = await importEmailSdkModule('@opencoredev/email-sdk/ses');
      return renameProvider(ses(options), adapterName);
    }
    case 'mailgun': {
      const options = omitSender(config as EmailProviderConfigMap['mailgun']);
      const { mailgun } = await importEmailSdkModule(
        '@opencoredev/email-sdk/mailgun',
      );
      return renameProvider(mailgun(options), adapterName);
    }
    case 'mailersend': {
      const options = omitSender(
        config as EmailProviderConfigMap['mailersend'],
      );
      const { mailersend } = await importEmailSdkModule(
        '@opencoredev/email-sdk/mailersend',
      );
      return renameProvider(mailersend(options), adapterName);
    }
    case 'brevo': {
      const options = omitSender(config as EmailProviderConfigMap['brevo']);
      const { brevo } = await importEmailSdkModule(
        '@opencoredev/email-sdk/brevo',
      );
      return renameProvider(brevo(options), adapterName);
    }
    case 'mailchimp': {
      const options = omitSender(config as EmailProviderConfigMap['mailchimp']);
      const { mailchimp } = await importEmailSdkModule(
        '@opencoredev/email-sdk/mailchimp',
      );
      return renameProvider(mailchimp(options), adapterName);
    }
    case 'sparkpost': {
      const options = omitSender(config as EmailProviderConfigMap['sparkpost']);
      const { sparkpost } = await importEmailSdkModule(
        '@opencoredev/email-sdk/sparkpost',
      );
      return renameProvider(sparkpost(options), adapterName);
    }
    case 'loops': {
      const options = omitSender(config as EmailProviderConfigMap['loops']);
      const { loops } = await importEmailSdkModule(
        '@opencoredev/email-sdk/loops',
      );
      return renameProvider(loops(options), adapterName);
    }
    case 'sequenzy': {
      const options = omitSender(config as EmailProviderConfigMap['sequenzy']);
      const { sequenzy } = await importEmailSdkModule(
        '@opencoredev/email-sdk/sequenzy',
      );
      return renameProvider(sequenzy(options), adapterName);
    }
    case 'jetemail': {
      const options = omitSender(config as EmailProviderConfigMap['jetemail']);
      const { jetemail } = await importEmailSdkModule(
        '@opencoredev/email-sdk/jetemail',
      );
      return renameProvider(jetemail(options), adapterName);
    }
    case 'lettermint': {
      const options = omitSender(
        config as EmailProviderConfigMap['lettermint'],
      );
      const { lettermint } = await importEmailSdkModule(
        '@opencoredev/email-sdk/lettermint',
      );
      return renameProvider(lettermint(options), adapterName);
    }
    case 'primitive': {
      const options = omitSender(config as EmailProviderConfigMap['primitive']);
      const { primitive } = await importEmailSdkModule(
        '@opencoredev/email-sdk/primitive',
      );
      return renameProvider(primitive(options), adapterName);
    }
    case 'plunk': {
      const options = omitSender(config as EmailProviderConfigMap['plunk']);
      const { plunk } = await importEmailSdkModule(
        '@opencoredev/email-sdk/plunk',
      );
      return renameProvider(plunk(options), adapterName);
    }
    case 'mailtrap': {
      const options = omitSender(config as EmailProviderConfigMap['mailtrap']);
      const { mailtrap } = await importEmailSdkModule(
        '@opencoredev/email-sdk/mailtrap',
      );
      return renameProvider(mailtrap(options), adapterName);
    }
    case 'scaleway': {
      const options = omitSender(config as EmailProviderConfigMap['scaleway']);
      const { scaleway } = await importEmailSdkModule(
        '@opencoredev/email-sdk/scaleway',
      );
      return renameProvider(scaleway(options), adapterName);
    }
    case 'zeptomail': {
      const options = omitSender(config as EmailProviderConfigMap['zeptomail']);
      const { zeptomail } = await importEmailSdkModule(
        '@opencoredev/email-sdk/zeptomail',
      );
      return renameProvider(zeptomail(options), adapterName);
    }
    case 'mailpace': {
      const options = omitSender(config as EmailProviderConfigMap['mailpace']);
      const { mailpace } = await importEmailSdkModule(
        '@opencoredev/email-sdk/mailpace',
      );
      return renameProvider(mailpace(options), adapterName);
    }
    case 'email': {
      const options = omitSender(config as EmailProviderConfigMap['email']);
      const { smtp } = await importEmailSdkModule(
        '@opencoredev/email-sdk/smtp',
      );
      return renameProvider(smtp(options), adapterName);
    }
  }
}

function omitSender<T extends { senderEmail: string; senderName: string }>(
  config: T,
): Omit<T, 'senderEmail' | 'senderName'> {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([key]) => key !== 'senderEmail' && key !== 'senderName',
    ),
  ) as Omit<T, 'senderEmail' | 'senderName'>;
}

function renameProvider(
  provider: EmailSdkProvider,
  name: string,
): EmailSdkProvider {
  return {
    ...provider,
    name,
    send: (message, context) => provider.send(message, context),
  };
}
