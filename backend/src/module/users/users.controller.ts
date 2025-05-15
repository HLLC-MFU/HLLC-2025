import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('users:read')
  async findAll(
    @Query() query: Record<string, any>
  ) {
    const { page = 1, limit, excluded = '', ...filters } = query;
    const excludedList = excluded.split(',').filter(Boolean);
    const parsedLimit = limit !== undefined ? +limit : undefined;
    const parsedPage = page !== undefined ? +page : 1;
  
    return this.usersService.findAll(filters, parsedPage, parsedLimit, excludedList);
  }

  @Get(':id')
  @Permissions('users:read:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('users:update:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('users:delete:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Reset a user's password to the default value
   */
  @Post(':id/reset-password')
  @HttpCode(200)
  @Permissions('users:update:id')
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }

  /**
   * Upload multiple users in bulk
   */
  @Post('upload')
  @Permissions('users:create')
  uploadUsers(@Body() uploadData: {
    users: Array<{
      name: { first: string; last: string };
      studentId: string;
      major?: string;
    }>;
    major?: string;
    role: string;
    metadata?: Record<string, any>;
  }) {
    return this.usersService.uploadUsers(uploadData);
  }

  /**
   * Get registration statistics
   */
  @Get('stats/registration')
  @Permissions('users:read')
  checkRegistrationStatus() {
    return this.usersService.checkRegistrationStatus();
  }

  /**
   * Find a user by their username (student ID)
   */
  @Get('by-username/:username')
  @Permissions('users:read')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  /**
   * Delete multiple users by ID
   */
  @Post('remove-multiple')
  @HttpCode(200)
  @Permissions('users:delete')
  removeMultiple(@Body() data: { ids: string[] }) {
    return this.usersService.removeMultiple(data.ids);
  }
}
