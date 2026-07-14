import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { STATUS_CODES } from 'http';
import { ZodError } from 'zod';

type ExceptionResponse = Record<string, unknown>;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly sensitiveFields = new Set([
    'authorization',
    'cookie',
    'password',
    'currentpassword',
    'newpassword',
    'confirmpassword',
    'token',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'csrftoken',
    'csrf_token',
    'twofactorsecret',
    'two_factor_secret',
    'twofactorsecretencrypted',
  ]);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = this.getStatus(exception);
    const exceptionResponse = this.getExceptionResponse(exception);
    const normalizedResponse =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : {};
    const error = this.getErrorTitle(status, normalizedResponse);
    const message = this.getMessage(exception, normalizedResponse);
    const meta = this.getMeta(normalizedResponse);
    const requestId = this.getRequestId(request);

    const responsePayload = {
      statusCode: status,
      code: this.getCode(status, normalizedResponse),
      error,
      message,
      meta,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    this.logException(exception, request, responsePayload);

    response.setHeader('x-request-id', requestId);
    response.status(status).json(responsePayload);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getExceptionResponse(exception: unknown): ExceptionResponse {
    if (exception instanceof ZodError) {
      return {
        code: 'response_validation_failed',
        message: 'The server produced an invalid response.',
        meta: {},
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (this.isRecord(response)) {
        return response;
      }

      return {
        message: response,
      };
    }

    return {};
  }

  private getErrorTitle(status: number, response: object): string {
    if ('error' in response && typeof response.error === 'string') {
      return response.error;
    }

    return STATUS_CODES[status] ?? 'Error';
  }

  private getMessage(exception: unknown, response: object): string {
    if ('message' in response) {
      if (Array.isArray(response.message)) {
        return response.message.join(', ');
      }

      if (typeof response.message === 'string') {
        return response.message;
      }
    }

    if (exception instanceof HttpException && exception.message) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private getMeta(response: object): Record<string, unknown> {
    if ('meta' in response && this.isRecord(response.meta)) {
      return response.meta;
    }

    const meta: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(response)) {
      if (
        ![
          'statusCode',
          'code',
          'error',
          'message',
          'meta',
          'domainError',
        ].includes(key)
      ) {
        meta[key] = value;
      }
    }

    return meta;
  }

  private getCode(status: number, response: object): string {
    if ('code' in response && typeof response.code === 'string') {
      return response.code;
    }

    const statusCodeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'bad_request',
      [HttpStatus.UNAUTHORIZED]: 'unauthorized',
      [HttpStatus.FORBIDDEN]: 'forbidden',
      [HttpStatus.NOT_FOUND]: 'not_found',
      [HttpStatus.CONFLICT]: 'conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'validation_failed',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal_error',
    };

    return statusCodeMap[status] ?? 'http_error';
  }

  private logException(
    exception: unknown,
    request: Request,
    responsePayload: {
      statusCode: number;
      code: string;
      error: string;
      message: string;
      meta: Record<string, unknown>;
      timestamp: string;
      path: string;
      requestId: string;
    },
  ): void {
    const details = this.formatExceptionLog(
      exception,
      request,
      responsePayload,
    );

    if (responsePayload.statusCode >= 500) {
      this.logger.error(details);
      return;
    }

    this.logger.warn(details);
  }

  private formatExceptionLog(
    exception: unknown,
    request: Request,
    responsePayload: {
      statusCode: number;
      code: string;
      error: string;
      message: string;
      meta: Record<string, unknown>;
      timestamp: string;
      path: string;
      requestId: string;
    },
  ): string {
    const separator = '='.repeat(80);
    const exceptionName =
      exception instanceof Error ? exception.name : typeof exception;
    const stack = exception instanceof Error ? exception.stack : undefined;
    const context = {
      params: this.redactSensitiveData(request.params),
      query: this.redactSensitiveData(request.query),
      body: this.redactSensitiveData(request.body),
      meta: this.redactSensitiveData(responsePayload.meta),
      schemaIssues:
        exception instanceof ZodError
          ? exception.issues.map((issue) => ({
              code: issue.code,
              path: issue.path,
              message: issue.message,
            }))
          : undefined,
    };
    const lines = [
      separator,
      `🚨 ERROR OCCURRED AT: ${responsePayload.timestamp}`,
      `📝 REQUEST: ${this.toSingleLine(request.method)} ${this.toSingleLine(request.originalUrl || request.url)}`,
      `🔢 STATUS: ${responsePayload.statusCode} ${this.toSingleLine(responsePayload.error)} (${this.toSingleLine(responsePayload.code)})`,
      `🌐 IP: ${this.toSingleLine(request.ip || request.socket?.remoteAddress || 'unknown')}`,
      `🔍 USER-AGENT: ${this.toSingleLine(request.get?.('user-agent') || 'unknown')}`,
      `❌ ERROR NAME: ${this.toSingleLine(exceptionName)}`,
      `💬 ERROR MESSAGE: ${this.toSingleLine(this.getExceptionMessage(exception))}`,
    ];

    const populatedContext = Object.fromEntries(
      Object.entries(context).filter(([, value]) => !this.isEmpty(value)),
    );
    if (Object.keys(populatedContext).length > 0) {
      lines.push(`📦 CONTEXT:\n${JSON.stringify(populatedContext, null, 2)}`);
    }

    if (stack) {
      lines.push(`📚 STACK TRACE:\n${stack}`);
    }

    lines.push(separator);
    return `\n${lines.join('\n')}`;
  }

  private toSingleLine(value: unknown): string {
    return String(value)
      .replace(/[\r\n]+/g, ' ')
      .trim();
  }

  private isEmpty(value: unknown): boolean {
    if (value === undefined || value === null || value === '') {
      return true;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return this.isRecord(value) && Object.keys(value).length === 0;
  }

  private redactSensitiveData(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactSensitiveData(item));
    }

    if (!this.isRecord(value)) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        this.isSensitiveField(key)
          ? '[redacted]'
          : this.redactSensitiveData(entryValue),
      ]),
    );
  }

  private getExceptionMessage(exception: unknown): string {
    if (exception instanceof Error && exception.message) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    return 'No exception message available';
  }

  private isSensitiveField(key: string): boolean {
    return this.sensitiveFields.has(key.toLowerCase());
  }

  private getRequestId(request: Request): string {
    const incomingRequestId = request.headers['x-request-id'];
    const value = Array.isArray(incomingRequestId)
      ? incomingRequestId[0]
      : incomingRequestId;

    if (typeof value === 'string' && value.length > 0 && value.length <= 128) {
      return value;
    }

    return randomUUID();
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
