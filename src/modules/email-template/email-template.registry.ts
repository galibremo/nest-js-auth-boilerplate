import type { RoleTypeEnum } from '../../core/database/drizzle/drizzle.types';

// ─── Template Key Constants ────────────────────────────────────────────────────

export const TEMPLATE_KEYS = {
  AUTH_ACCOUNT_APPROVAL: 'auth_account_approval',
  AUTH_INVITATION: 'auth_invitation',
  AUTH_MAGIC_LINK: 'auth_magic_link',
  AUTH_WELCOME: 'auth_welcome',
  CHAT_NEW_MESSAGE: 'chat_new_message',
  CHAT_MENTION: 'chat_mention',
} as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS];

// ─── Variable Descriptor (stored in DB) ────────────────────────────────────────

export type TemplateVariableType = 'string' | 'number' | 'boolean';

export interface TemplateVariableDescriptor {
  name: string;
  type: TemplateVariableType;
  required: boolean;
  description: string;
}

// ─── Type-Safe Params Map ──────────────────────────────────────────────────────

export interface TemplateVariableMap {
  auth_account_approval: {
    name: string;
    approvedByName: string;
    appUrl: string;
    year: number;
  };
  auth_invitation: {
    name: string;
    role: RoleTypeEnum;
    createdByName: string;
    appUrl: string;
    year: number;
  };
  auth_magic_link: {
    verificationUrl: string;
    redirectUrl: string;
    expiresInMinutes: number;
    year: number;
  };
  auth_welcome: {
    name: string;
    email: string;
    year: number;
  };
  chat_new_message: {
    name: string;
    senderName: string;
    conversationTitle: string;
    messagePreview: string;
    appUrl: string;
    year: number;
  };
  chat_mention: {
    name: string;
    mentionedByName: string;
    conversationTitle: string;
    messagePreview: string;
    appUrl: string;
    year: number;
  };
}

// ─── Runtime Registry (variable descriptors per template) ──────────────────────

export const TEMPLATE_REGISTRY: Record<
  TemplateKey,
  TemplateVariableDescriptor[]
> = {
  [TEMPLATE_KEYS.AUTH_ACCOUNT_APPROVAL]: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Recipient display name (defaults to "there")',
    },
    {
      name: 'approvedByName',
      type: 'string',
      required: true,
      description: 'Name of the admin who approved the account',
    },
    {
      name: 'appUrl',
      type: 'string',
      required: true,
      description: 'Application URL',
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      description: 'Current year for footer copyright',
    },
  ],
  [TEMPLATE_KEYS.AUTH_INVITATION]: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Recipient display name (defaults to "there")',
    },
    {
      name: 'role',
      type: 'string',
      required: true,
      description: 'Assigned role (ADMIN, MANAGER, USER, SUPER_ADMIN)',
    },
    {
      name: 'createdByName',
      type: 'string',
      required: true,
      description: 'Name of the admin who created the invitation',
    },
    {
      name: 'appUrl',
      type: 'string',
      required: true,
      description: 'Application URL',
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      description: 'Current year for footer copyright',
    },
  ],
  [TEMPLATE_KEYS.AUTH_MAGIC_LINK]: [
    {
      name: 'verificationUrl',
      type: 'string',
      required: true,
      description: 'Magic link verification URL',
    },
    {
      name: 'redirectUrl',
      type: 'string',
      required: true,
      description: 'URL to redirect after verification',
    },
    {
      name: 'expiresInMinutes',
      type: 'number',
      required: true,
      description: 'Link expiration time in minutes',
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      description: 'Current year for footer copyright',
    },
  ],
  [TEMPLATE_KEYS.AUTH_WELCOME]: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Recipient display name (defaults to "there")',
    },
    {
      name: 'email',
      type: 'string',
      required: true,
      description: 'Recipient email address',
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      description: 'Current year for footer copyright',
    },
  ],
  [TEMPLATE_KEYS.CHAT_NEW_MESSAGE]: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Recipient display name (defaults to "there")',
    },
    {
      name: 'senderName',
      type: 'string',
      required: true,
      description: 'Name of the message sender',
    },
    {
      name: 'conversationTitle',
      type: 'string',
      required: true,
      description: 'Title of the conversation',
    },
    {
      name: 'messagePreview',
      type: 'string',
      required: true,
      description: 'Preview text of the message',
    },
    {
      name: 'appUrl',
      type: 'string',
      required: true,
      description: 'Application URL',
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      description: 'Current year for footer copyright',
    },
  ],
  [TEMPLATE_KEYS.CHAT_MENTION]: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Recipient display name (defaults to "there")',
    },
    {
      name: 'mentionedByName',
      type: 'string',
      required: true,
      description: 'Name of the person who mentioned the recipient',
    },
    {
      name: 'conversationTitle',
      type: 'string',
      required: true,
      description: 'Title of the conversation',
    },
    {
      name: 'messagePreview',
      type: 'string',
      required: true,
      description: 'Preview text of the message',
    },
    {
      name: 'appUrl',
      type: 'string',
      required: true,
      description: 'Application URL',
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      description: 'Current year for footer copyright',
    },
  ],
};

// ─── Helper: get variables for a template key ──────────────────────────────────

export function getTemplateVariables(
  key: TemplateKey,
): TemplateVariableDescriptor[] {
  return TEMPLATE_REGISTRY[key];
}

/**
 * Check if a string is a known template key.
 */
export function isTemplateKey(key: string): key is TemplateKey {
  return key in TEMPLATE_REGISTRY;
}
