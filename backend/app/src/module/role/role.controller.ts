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
  @Permissions('roles:create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @Permissions('roles:read')
  @CacheKey('roles:read')
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @Permissions('roles:read:id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Put(':id/metadata-schema')
  @Permissions('roles:update:metadata-schema')
  @CacheKey('roles:invalidate')
  updateMetadataSchema(
    @Param('id') id: string,
    @Body() dto: UpdateMetadataSchemaDto,
  ) {
    return this.roleService.updateMetadataSchema(id, dto);
  }

  @Patch(':id')
  @Permissions('roles:update')
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
  @Permissions('roles:update:checkin-scope')
  async updateCheckinScope(
    @Param('id') id: string,
    @Body()
    user?: string[],
    major?: string[],
    school?: string[],
  ) {
    return this.roleService.updateCheckinScope(id, user, major, school);
  }

  @Delete(':id')
  @Permissions('roles:delete')
  @CacheKey('roles:invalidate')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
