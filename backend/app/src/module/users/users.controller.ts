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
  BadRequestException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CacheKey } from '@nestjs/cache-manager';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { isValidObjectId } from 'mongoose';
import { FastifyRequest } from 'fastify';
import { UserUploadDirectDto } from './dto/upload.user.dto';

@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()
  @CacheKey('users:invalidate')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }

  @Get()
  @Permissions('users:read')
  @CacheKey('users')
  async findAll(@Query() query: Record<string, any>) {
    return this.usersService.findAllByQuery(query);
  }

  @Get('me')
  async getProfile(@Req() req: FastifyRequest & { user?: { _id: string } }) {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.usersService.findOneByQuery({ _id: userId });
  }

  @Get(':id')
  @Permissions('users:read:id')
  @CacheKey('users:$params.id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('upload')
  @Public()
  upload(@Body() userUploadDirectDto: UserUploadDirectDto[]) {
    return this.usersService.upload(userUploadDirectDto);
  }

  @Patch(':id')
  @CacheKey('users:invalidate')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @CacheKey('users:invalidate')
  @Public()
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
    @Body() registerTokenDto: Record<string, string>
  ) {
    return this.usersService.registerDeviceToken(id, registerTokenDto);
  }

  @Delete(':id/device-token/:deviceToken')
  @Public()
  removeDeviceToken(
    @Param('id') id: string,
    @Param('deviceToken') deviceToken: string
  ) {
    return this.usersService.removeDeviceToken(id, deviceToken);
  }
}
