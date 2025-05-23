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
} from '@nestjs/common';

import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { CacheKey } from '@nestjs/cache-manager';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UploadUserDto } from './dto/upload.user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users:create')
  @CacheKey('users:invalidate')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('users:read')
  @CacheKey('users')
  async findAll(@Query() query: Record<string, any>) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload & { _id: string }) {
    return this.usersService.getMe(user._id);
  }

  @Get('search/:username')
  @Permissions('users:read')
  @CacheKey('users:search:$params.username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Get(':id')
  @Permissions('users:read:id')
  @CacheKey('users:$params.id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('upload')
  @Permissions('users:create')
  upload(@Body() uploadUserDto: UploadUserDto) {
    return this.usersService.upload(uploadUserDto);
  }

  @Patch(':id')
  @Permissions('users:update')
  @CacheKey('users:invalidate')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('users:delete')
  @CacheKey('users:invalidate')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete('multiple')
  @Permissions('users:delete')
  @CacheKey('users:invalidate')
  removeMultiple(@Body() ids: string[]) {
    return this.usersService.removeMultiple(ids);
  }
}
