import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreateEvoucherTypeDto } from '../dto/evoucher-types/create-evoucher-type.dto';
import { UpdateEvoucherTypeDto } from '../dto/evoucher-types/update-evoucher-type.dto';
import { EvoucherTypeService } from '../service/evoucher-type.service';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { Permissions } from 'src/module/auth/decorators/permissions.decorator';
import { CacheKey } from '@nestjs/cache-manager';

@Controller('evoucher-type')
@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
export class EvoucherTypeController {
  constructor(private readonly evoucherTypeService: EvoucherTypeService) { }

  @Permissions('evoucher-type:create')
  @CacheKey('evoucher-type:invalidate')
  @Post()
  create(@Body() createEvoucherTypeDto: CreateEvoucherTypeDto) {
    return this.evoucherTypeService.create(createEvoucherTypeDto);
  }

  @Permissions('evoucher-type:read')
  @CacheKey('evoucher-type:invalidate')
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherTypeService.findAll(query);
  }

  @Permissions('evoucher-type:read')
  @CacheKey('evoucher-type:invalidate')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherTypeService.findOne(id);
  }

  @Permissions('evoucher-type:update')
  @CacheKey('evoucher-type:invalidate')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvoucherTypeDto: UpdateEvoucherTypeDto) {
    return this.evoucherTypeService.update(id, updateEvoucherTypeDto);
  }

  @Permissions('evoucher-type:delete')
  @CacheKey('evoucher-type:invalidate')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherTypeService.remove(id);
  }
}
