import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { Public } from '../auth/decorators/public.decorator';

import { CacheKey } from '@nestjs/cache-manager';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) { }

  @Post()
  @CacheKey('roles:invalidate')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @Permissions('roles:read')
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Put(':id/metadata-schema')
  @CacheKey('roles:invalidate')
  updateMetadataSchema(
    @Param('id') id: string,
    @Body() dto: UpdateMetadataSchemaDto,
  ) {
    return this.roleService.updateMetadataSchema(id, dto);
  }

  @Patch(':id')
  @CacheKey('roles:invalidate')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Patch(':id/permissions')
  @CacheKey('roles:invalidate')
  async updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.roleService.updatePermissions(id, dto.permissions);
  }

  @Patch(':id/checkin-scope')
  updateCheckinScope(
    @Param('id') id: string,
    @Body()
    user?: string[],
    major?: string[],
    school?: string[],
  ) {
    return this.roleService.updateCheckinScope(id, user, major, school);
  }

  @Delete(':id')
  @CacheKey('roles:invalidate')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
