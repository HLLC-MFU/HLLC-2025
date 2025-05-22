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
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
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
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Public()
  @CacheKey('users')
  // @Permissions('users:read')
  async findAll(@Query() query: Record<string, any>) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @UseGuards(PermissionsGuard)
  getMe(@CurrentUser() user: JwtPayload & { _id: string }) {
    console.log('✅ CurrentUser:', user);
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.getMe(user._id);
  }


  @Get('search/:username')
  @Public()
  @Permissions('users:read:username')
  @CacheKey('users:search:$params.username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Get(':id')
  @Public()
  @Permissions('users:read:id')
  @CacheKey('users:$params.id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('upload')
  @Public()
  @Permissions('users:upload')
  upload(@Body() uploadUserDto: UploadUserDto) {
    return this.usersService.upload(uploadUserDto);
  }

  @Patch(':id')
  @CacheKey('users:list')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @CacheKey('users')
  @Public()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
