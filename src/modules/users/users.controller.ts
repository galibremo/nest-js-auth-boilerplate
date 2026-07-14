import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import type {
  DeleteUserApiResponse,
  RevokeUserSessionsApiResponse,
  UserListApiResponse,
  UserManagementApiResponse,
  UserManagementResponse,
} from './schemas/users.schema';
import {
  type CreateUserDto,
  CreateUserSchema,
  DeleteUserApiResponseSchema,
  RevokeUserSessionsApiResponseSchema,
  type UpdateUserDto,
  UpdateUserSchema,
  UserListApiResponseSchema,
  UserManagementApiResponseSchema,
  type UsersListQueryDto,
  UsersListQuerySchema,
} from './schemas/users.schema';
import { UsersService } from './users.service';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers(
    @Req() request: ExpressRequest,
    @Query(new ZodValidationPipe(UsersListQuerySchema))
    query: UsersListQueryDto,
  ): Promise<UserListApiResponse> {
    const users = await this.usersService.listUsers(query);

    return UserListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Users fetched successfully',
        data: users,
        path: request.url,
      }),
    );
  }

  @Get(':id')
  async getUser(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserManagementApiResponse> {
    const user = await this.usersService.getUserById(id);

    return this.userResponse(
      HttpStatus.OK,
      'User fetched successfully',
      user,
      request.url,
    );
  }

  @Post()
  async createUser(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserDto,
  ): Promise<UserManagementApiResponse> {
    const user = await this.usersService.createUser(body);

    return this.userResponse(
      HttpStatus.CREATED,
      'User created successfully',
      user,
      request.url,
    );
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateUserSchema)) body: UpdateUserDto,
  ): Promise<UserManagementApiResponse> {
    const user = await this.usersService.updateUser(id, body);

    return this.userResponse(
      HttpStatus.OK,
      'User updated successfully',
      user,
      request.url,
    );
  }

  @Delete(':id')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeleteUserApiResponse> {
    const result = await this.usersService.deleteUser(id);

    return DeleteUserApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'User deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Post(':id/sessions/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeUserSessions(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<RevokeUserSessionsApiResponse> {
    const result = await this.usersService.revokeUserSessions(id);

    return RevokeUserSessionsApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'User sessions revoked successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  private userResponse(
    statusCode: HttpStatus,
    message: string,
    user: UserManagementResponse,
    path: string,
  ): UserManagementApiResponse {
    return UserManagementApiResponseSchema.parse(
      createApiResponse({
        statusCode,
        message,
        data: user,
        path,
      }),
    );
  }
}
