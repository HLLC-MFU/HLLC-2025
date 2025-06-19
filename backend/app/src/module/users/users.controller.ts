import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Body,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CacheKey } from '@nestjs/cache-manager';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { FastifyRequest } from 'fastify';
import { UserUploadDirectDto } from './dto/upload.user.dto';
import { ActivitiesService } from '../activities/services/activities.service';

@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  @Post()
  @Permissions('users:create')
  @CacheKey('users:invalidate')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('upload')
  @Permissions('users:upload')
  @CacheKey('users:invalidate')
  upload(@Body() uploadUserDtos: UserUploadDirectDto[]) {
    return this.usersService.upload(uploadUserDtos);
  }

  @Get()
  @Permissions('users:read')
  @CacheKey('users')
  async findAll(@Query() query: Record<string, string>) {
    return this.usersService.findAll(query);
  }

  @Get('statistics')
  @Permissions('users:read')
  @CacheKey('users:statistics')
  async getUserCountByRoles(): Promise<
    Record<string, { registered: number; notRegistered: number }>
  > {
    return this.usersService.getUserCountByRoles();
  }

  @Get(':id')
  @Permissions('users:read:id')
  @CacheKey('users:$params.id')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('profile')
  getProfile(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
  ) {
    const user = req.user as { _id?: string; id?: string };
    const userId: string = user?._id ?? user?.id ?? '';
    if (!userId) {
      return null;
    }
    return this.usersService.findOneByQuery({
      _id: userId,
    });
  }

  @Patch(':id')
  @CacheKey('users:invalidate')
  @Permissions('users:update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @CacheKey('users:invalidate')
  @Permissions('users:delete:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete('multiple')
  @Permissions('users:delete')
  @CacheKey('users:invalidate')
  removeMultiple(@Body() ids: string[]) {
    return this.usersService.removeMultiple(ids);
  }

  @Post(':id/device-token')
  // @CacheKey('users:read:id')
  @Public()
  registerDeviceToken(
    @Param('id') id: string,
    @Body() registerTokenDto: Record<string, string>,
  ) {
    return this.usersService.registerDeviceToken(id, registerTokenDto);
  }

  @Delete(':id/device-token/:deviceToken')
  @Public()
  removeDeviceToken(
    @Param('id') id: string,
    @Param('deviceToken') deviceToken: string,
  ) {
    return this.usersService.removeDeviceToken(id, deviceToken);
  }
}
