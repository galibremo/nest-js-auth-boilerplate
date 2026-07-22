type EmailSdkSpecifier =
	| '@opencoredev/email-sdk'
	| '@opencoredev/email-sdk/brevo'
	| '@opencoredev/email-sdk/cloudflare'
	| '@opencoredev/email-sdk/iterable'
	| '@opencoredev/email-sdk/jetemail'
	| '@opencoredev/email-sdk/lettermint'
	| '@opencoredev/email-sdk/loops'
	| '@opencoredev/email-sdk/mailchimp'
	| '@opencoredev/email-sdk/mailersend'
	| '@opencoredev/email-sdk/mailgun'
	| '@opencoredev/email-sdk/mailpace'
	| '@opencoredev/email-sdk/mailtrap'
	| '@opencoredev/email-sdk/plunk'
	| '@opencoredev/email-sdk/postmark'
	| '@opencoredev/email-sdk/primitive'
	| '@opencoredev/email-sdk/resend'
	| '@opencoredev/email-sdk/scaleway'
	| '@opencoredev/email-sdk/sendgrid'
	| '@opencoredev/email-sdk/sequenzy'
	| '@opencoredev/email-sdk/ses'
	| '@opencoredev/email-sdk/smtp'
	| '@opencoredev/email-sdk/sparkpost'
	| '@opencoredev/email-sdk/unosend'
	| '@opencoredev/email-sdk/zeptomail';

type EmailSdkModuleMap = {
	'@opencoredev/email-sdk': typeof import('@opencoredev/email-sdk');
	'@opencoredev/email-sdk/brevo': typeof import('@opencoredev/email-sdk/brevo');
	'@opencoredev/email-sdk/cloudflare': typeof import('@opencoredev/email-sdk/cloudflare');
	'@opencoredev/email-sdk/iterable': typeof import('@opencoredev/email-sdk/iterable');
	'@opencoredev/email-sdk/jetemail': typeof import('@opencoredev/email-sdk/jetemail');
	'@opencoredev/email-sdk/lettermint': typeof import('@opencoredev/email-sdk/lettermint');
	'@opencoredev/email-sdk/loops': typeof import('@opencoredev/email-sdk/loops');
	'@opencoredev/email-sdk/mailchimp': typeof import('@opencoredev/email-sdk/mailchimp');
	'@opencoredev/email-sdk/mailersend': typeof import('@opencoredev/email-sdk/mailersend');
	'@opencoredev/email-sdk/mailgun': typeof import('@opencoredev/email-sdk/mailgun');
	'@opencoredev/email-sdk/mailpace': typeof import('@opencoredev/email-sdk/mailpace');
	'@opencoredev/email-sdk/mailtrap': typeof import('@opencoredev/email-sdk/mailtrap');
	'@opencoredev/email-sdk/plunk': typeof import('@opencoredev/email-sdk/plunk');
	'@opencoredev/email-sdk/postmark': typeof import('@opencoredev/email-sdk/postmark');
	'@opencoredev/email-sdk/primitive': typeof import('@opencoredev/email-sdk/primitive');
	'@opencoredev/email-sdk/resend': typeof import('@opencoredev/email-sdk/resend');
	'@opencoredev/email-sdk/scaleway': typeof import('@opencoredev/email-sdk/scaleway');
	'@opencoredev/email-sdk/sendgrid': typeof import('@opencoredev/email-sdk/sendgrid');
	'@opencoredev/email-sdk/sequenzy': typeof import('@opencoredev/email-sdk/sequenzy');
	'@opencoredev/email-sdk/ses': typeof import('@opencoredev/email-sdk/ses');
	'@opencoredev/email-sdk/smtp': typeof import('@opencoredev/email-sdk/smtp');
	'@opencoredev/email-sdk/sparkpost': typeof import('@opencoredev/email-sdk/sparkpost');
	'@opencoredev/email-sdk/unosend': typeof import('@opencoredev/email-sdk/unosend');
	'@opencoredev/email-sdk/zeptomail': typeof import('@opencoredev/email-sdk/zeptomail');
};

export function importEmailSdkModule<TSpecifier extends EmailSdkSpecifier>(
	specifier: TSpecifier,
): Promise<EmailSdkModuleMap[TSpecifier]> {
	return import(specifier) as Promise<EmailSdkModuleMap[TSpecifier]>;
}
