import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';

import { badGatewayError, notFoundError } from '../../core/errors/domain-error';
import { EmailProvidersRepository } from '../email-provider/email-providers.repository';
import { EmailDispatcherService } from '../email-provider/services/email-dispatcher.service';
import { EmailLogsService } from './email-logs.service';
import {
  type DeletedEmailLogApiResponse,
  DeletedEmailLogApiResponseSchema,
  type EmailLogApiResponse,
  EmailLogApiResponseSchema,
  type EmailLogListApiResponse,
  EmailLogListApiResponseSchema,
  type EmailLogsListQueryDto,
  EmailLogsListQuerySchema,
} from './schemas/email-logs.schema';
import { ZodValidationPipe } from 'src/shared/pipes/zod-validation.pipe';
import { createApiResponse } from 'src/shared/helpers/api-response.helper';

@UseGuards(AuthGuard)
@Roles(['SUPER_ADMIN'])
@Controller('email-logs')
export class EmailLogsController {
  constructor(
    private readonly emailLogsService: EmailLogsService,
    private readonly emailDispatcher: EmailDispatcherService,
    private readonly emailProvidersRepository: EmailProvidersRepository,
  ) {}

  @Get()
  async listEmailLogs(
    @Req() request: Request,
    @Query(new ZodValidationPipe(EmailLogsListQuerySchema))
    query: EmailLogsListQueryDto,
  ): Promise<EmailLogListApiResponse> {
    let providerId: number | undefined;
    if (query.providerId) {
      const provider = await this.emailProvidersRepository.findByPublicId(
        query.providerId,
      );
      if (!provider) {
        throw notFoundError(
          'email_provider_not_found',
          'email provider not found',
        );
      }
      providerId = provider.id;
    }

    const result = await this.emailLogsService.listAllLogs(providerId, query);
    return EmailLogListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Email logs fetched successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Get(':logId')
  async getEmailLog(
    @Req() request: Request,
    @Param('logId') logId: string,
  ): Promise<EmailLogApiResponse> {
    const log = await this.emailLogsService.getLogByPublicId(logId);
    return EmailLogApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Email log fetched successfully',
        data: log,
        path: request.url,
      }),
    );
  }

  @Post(':logId/resend')
  @HttpCode(HttpStatus.OK)
  async resendEmailLog(
    @Req() request: Request,
    @Param('logId') logId: string,
  ): Promise<EmailLogApiResponse> {
    const logData = await this.emailLogsService.getLogForResend(logId);

    try {
      await this.emailDispatcher.sendFromTemplate({
        templateKey: logData.templateKey,
        to: [{ email: logData.toEmail, name: logData.toName ?? undefined }],
        params: {},
      });
    } catch {
      throw badGatewayError('email_resend_failed', 'Failed to resend email');
    }

    const latestLog = await this.emailLogsService.getLatestLogForProvider(
      logData.emailProviderId ?? 0,
    );

    return EmailLogApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Email resent successfully',
        data:
          latestLog ?? (await this.emailLogsService.getLogByPublicId(logId)),
        path: request.url,
      }),
    );
  }

  @Delete(':logId')
  async deleteEmailLog(
    @Req() request: Request,
    @Param('logId') logId: string,
  ): Promise<DeletedEmailLogApiResponse> {
    const result = await this.emailLogsService.deleteLogByPublicId(logId);
    return DeletedEmailLogApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Email log deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }
}
