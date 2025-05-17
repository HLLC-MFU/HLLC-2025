import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

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
  @CacheKey('users:list')
  @CacheTTL(5)
  // @Permissions('users:read')
  async findAll(@Query() query: Record<string, any>) {
    const { page = 1, limit, excluded = '', ...filters } = query;
    const excludedStr: string = typeof excluded === 'string' ? excluded : '';
    const excludedList: string[] = excludedStr.split(',').filter(Boolean);
    const parsedLimit = limit !== undefined ? +limit : undefined;
    const parsedPage = page !== undefined ? +page : 1;

    return this.usersService.findAll(
      filters,
      parsedPage,
      parsedLimit,
      excludedList,
    );
  }

  @Get(':id')
  @Permissions('users:read:id')
  @CacheKey('users:list')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @CacheKey('users:list')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @CacheKey('users:list')
  @Public()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
