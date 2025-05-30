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
import { UploadUserDto } from './dto/upload.user.dto';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { FastifyRequest } from 'fastify';

@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()
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

  @Get('statistics')
  @Permissions('users:read')
  @CacheKey('users:statistics')
  async getUserCountByRoles(): Promise<Record<string, number>> {
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
  @CacheKey('users:$req.user')
  getProfile(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
  ) {
    const user = req.user as { _id?: string; id?: string } | undefined;
    const userId: string | undefined = user?._id ?? user?.id;
    return this.usersService.findOneByQuery({
      _id: userId,
    });
  }

  @Post('upload')
  @Permissions('users:create')
  upload(@Body() uploadUserDto: UploadUserDto) {
    return this.usersService.upload(uploadUserDto);
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
}
