import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import {
  type CreateEmailProviderDto,
  CreateEmailProviderSchema,
  DeletedEmailProviderApiResponseSchema,
  type DeletedEmailProviderApiResponse,
  EmailProviderListApiResponseSchema,
  type EmailProviderApiResponse,
  EmailProviderApiResponseSchema,
  type EmailProviderListApiResponse,
  type EmailProvidersListQueryDto,
  EmailProvidersListQuerySchema,
  type TestConnectionApiResponse,
  TestConnectionApiResponseSchema,
  type TestEmailProviderDto,
  TestEmailProviderSchema,
  type UpdateEmailProviderDto,
  UpdateEmailProviderSchema,
} from './schemas/email-providers.schema';
import { EmailProvidersService } from './services/email-providers.service';
import { ZodValidationPipe } from 'src/shared/pipes/zod-validation.pipe';
import { createApiResponse } from 'src/shared/helpers/api-response.helper';

@UseGuards(AuthGuard)
@Roles(['SUPER_ADMIN'])
@Controller('email-providers')
export class EmailProvidersController {
  constructor(private readonly emailProvidersService: EmailProvidersService) {}

  @Get()
  async listProviders(
    @Req() request: ExpressRequest,
    @Query(new ZodValidationPipe(EmailProvidersListQuerySchema))
    query: EmailProvidersListQueryDto,
  ): Promise<EmailProviderListApiResponse> {
    const result = await this.emailProvidersService.listProviders(query);
    return EmailProviderListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'email providers fetched successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Get(':id')
  async getProvider(
    @Req() request: ExpressRequest,
    @Param('id') id: string,
  ): Promise<EmailProviderApiResponse> {
    const provider = await this.emailProvidersService.getProvider(id);
    return EmailProviderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'email provider fetched successfully',
        data: provider,
        path: request.url,
      }),
    );
  }

  @Post()
  async createProvider(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateEmailProviderSchema))
    body: CreateEmailProviderDto,
  ): Promise<EmailProviderApiResponse> {
    const provider = await this.emailProvidersService.createProvider(body);
    return EmailProviderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'email provider created successfully',
        data: provider,
        path: request.url,
      }),
    );
  }

  @Patch(':id')
  async updateProvider(
    @Req() request: ExpressRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEmailProviderSchema))
    body: UpdateEmailProviderDto,
  ): Promise<EmailProviderApiResponse> {
    const provider = await this.emailProvidersService.updateProvider(id, body);
    return EmailProviderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'email provider updated successfully',
        data: provider,
        path: request.url,
      }),
    );
  }

  @Delete(':id')
  async deleteProvider(
    @Req() request: ExpressRequest,
    @Param('id') id: string,
  ): Promise<DeletedEmailProviderApiResponse> {
    const result = await this.emailProvidersService.deleteProvider(id);
    return DeletedEmailProviderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'email provider deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @Req() request: ExpressRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TestEmailProviderSchema))
    body: TestEmailProviderDto,
  ): Promise<TestConnectionApiResponse> {
    const result = await this.emailProvidersService.testConnection(id, body);
    return TestConnectionApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: result.success
          ? 'Connection test successful'
          : 'Connection test failed',
        data: result,
        path: request.url,
      }),
    );
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.OK)
  async setDefault(
    @Req() request: ExpressRequest,
    @Param('id') id: string,
  ): Promise<EmailProviderApiResponse> {
    const provider = await this.emailProvidersService.setDefault(id);
    return EmailProviderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Default email provider set successfully',
        data: provider,
        path: request.url,
      }),
    );
  }

  @Patch(':id/toggle')
  async toggleProvider(
    @Req() request: ExpressRequest,
    @Param('id') id: string,
  ): Promise<EmailProviderApiResponse> {
    const provider = await this.emailProvidersService.toggleProvider(id);
    return EmailProviderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'email provider toggled successfully',
        data: provider,
        path: request.url,
      }),
    );
  }
}
