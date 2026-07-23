import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest, Response } from 'express';
import 'multer';

import { badRequestError } from '../../core/errors/domain-error';
import type { AuthInstance } from '../auth/auth.factory';
import { mapUserResponse } from '../auth/auth.mapper';
import { MediaService } from './media.service';
import type {
  PresignedUrlApiResponse,
  PresignedUrlInput,
  UploadApiResponse,
} from './schemas/media.schema';
import {
  PresignedUrlApiResponseSchema,
  PresignedUrlInputSchema,
  UploadApiResponseSchema,
} from './schemas/media.schema';
import { ZodValidationPipe } from 'src/shared/pipes/zod-validation.pipe';
import { createApiResponse } from 'src/shared/helpers/api-response.helper';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Public profile avatar proxy. Serves objects under `profiles/` over the API origin so the
   * dashboard (HTTPS) can display them even when S3_ENDPOINT is not browser-reachable.
   */
  @Get('public/*path')
  async servePublicProfileImage(
    @Param('path') objectPath: string | string[],
    @Res() response: Response,
  ): Promise<void> {
    const key = (
      Array.isArray(objectPath) ? objectPath.join('/') : objectPath
    ).replace(/^\/+/, '');
    const object = await this.mediaService.getPublicProfileObject(key);

    response.setHeader('Content-Type', object.contentType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.status(200).send(object.body);
  }

  @Post('presigned-url')
  @UseGuards(AuthGuard)
  async generatePresignedUrl(
    @Req() request: ExpressRequest,
    @Session() session: UserSession<AuthInstance>,
    @Body(new ZodValidationPipe(PresignedUrlInputSchema))
    input: PresignedUrlInput,
  ): Promise<PresignedUrlApiResponse> {
    const result = await this.mediaService.generatePresignedUrl(
      mapUserResponse(session),
      input,
    );
    return PresignedUrlApiResponseSchema.parse(
      createApiResponse({
        statusCode: 201,
        message: 'Presigned URL generated successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow basic media types
        if (
          !file.mimetype.match(
            /\/(jpg|jpeg|png|gif|mp4|webm|ogg|mpeg|wav|x-m4a|aac|opus|pdf|doc|docx|csv)$/,
          )
        ) {
          return cb(new Error('Unsupported file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @Req() request: ExpressRequest,
    @Session() session: UserSession<AuthInstance>,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw badRequestError('File is required');
    }

    if (folder && typeof folder !== 'string') {
      throw badRequestError('Folder must be a string.');
    }

    const result = await this.mediaService.uploadFile(
      mapUserResponse(session),
      file,
      folder,
    );
    return UploadApiResponseSchema.parse(
      createApiResponse({
        statusCode: 201,
        message: 'File uploaded successfully',
        data: result,
        path: request.url,
      }),
    );
  }
}
