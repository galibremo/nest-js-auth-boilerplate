import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';

import {
  type EmailTemplateListQueryDto,
  EmailTemplateListQuerySchema,
} from './schemas/email-template-list.schema';
import {
  type EmailTemplateApiResponse,
  EmailTemplateApiResponseSchema,
  type EmailTemplateListApiResponse,
  EmailTemplateListApiResponseSchema,
  type UpdateEmailTemplateDto,
  UpdateEmailTemplateSchema,
} from './schemas/email-template.schema';
import { EmailTemplateService } from './email-template.service';
import { createApiResponse } from 'src/shared/helpers/api-response.helper';
import { ZodValidationPipe } from 'src/shared/pipes/zod-validation.pipe';

@UseGuards(AuthGuard)
@Roles(['SUPER_ADMIN'])
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Get()
  async listTemplates(
    @Req() request: Request,
    @Query(new ZodValidationPipe(EmailTemplateListQuerySchema))
    query: EmailTemplateListQueryDto,
  ): Promise<EmailTemplateListApiResponse> {
    const result = await this.emailTemplateService.getActiveTemplates(query);
    return EmailTemplateListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Email templates fetched successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Get(':publicId')
  async getTemplate(
    @Req() request: Request,
    @Param('publicId') publicId: string,
  ): Promise<EmailTemplateApiResponse> {
    const template = await this.emailTemplateService.getByPublicId(publicId);
    return EmailTemplateApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Email template fetched successfully',
        data: template,
        path: request.url,
      }),
    );
  }

  @Patch(':publicId')
  async updateTemplate(
    @Req() request: Request,
    @Param('publicId') publicId: string,
    @Body(new ZodValidationPipe(UpdateEmailTemplateSchema))
    body: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateApiResponse> {
    const template = await this.emailTemplateService.updateTemplate(
      publicId,
      body,
    );
    return EmailTemplateApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Email template updated successfully',
        data: template,
        path: request.url,
      }),
    );
  }
}
