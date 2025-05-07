import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
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
  @Permissions('users:read:id', 'users:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
