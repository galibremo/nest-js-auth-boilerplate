import type { EmailTemplateSchemaType } from '../../core/database/drizzle/drizzle.types';

export interface CompiledEmailTemplate {
  key: string;
  version: number;
  subject: TemplateRenderer;
  html: TemplateRenderer;
  text?: TemplateRenderer;
}

export interface RenderedEmailTemplate {
  subject: string;
  html: string;
  text?: string;
  version: number;
}

type TemplateRenderer = (params: Record<string, unknown>) => string;

export function compileEmailTemplate(
  template: EmailTemplateSchemaType,
): CompiledEmailTemplate {
  return {
    key: template.key,
    version: template.version,
    subject: compileTemplateLiteral(template.subject),
    html: compileTemplateLiteral(template.html, { escapeHtml: true }),
    text: template.text ? compileTemplateLiteral(template.text) : undefined,
  };
}

export function renderEmailTemplate(
  template: CompiledEmailTemplate,
  params: Record<string, unknown>,
): RenderedEmailTemplate {
  return {
    subject: template.subject(params),
    html: template.html(params),
    text: template.text ? template.text(params) : undefined,
    version: template.version,
  };
}

function compileTemplateLiteral(
  template: string,
  options: { escapeHtml?: boolean } = {},
): TemplateRenderer {
  return (params) =>
    template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
      const value = resolveTemplateValue(params, key);
      const rendered = stringifyTemplateValue(value);

      return options.escapeHtml ? escapeHtml(rendered) : rendered;
    });
}

function resolveTemplateValue(
  params: Record<string, unknown>,
  key: string,
): unknown {
  return key.split('.').reduce<unknown>((currentValue, segment) => {
    if (
      currentValue &&
      typeof currentValue === 'object' &&
      segment in currentValue
    ) {
      return (currentValue as Record<string, unknown>)[segment];
    }

    return undefined;
  }, params);
}

function stringifyTemplateValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return '';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
