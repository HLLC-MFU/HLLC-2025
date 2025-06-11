import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, Req, UseGuards } from '@nestjs/common';

import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import { EvoucherService } from '../service/evoucher.service';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { Permissions } from 'src/module/auth/decorators/permissions.decorator';
import { CacheKey } from '@nestjs/cache-manager';

@Controller('evoucher')
@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
export class EvoucherController {
  constructor(private readonly evoucherService: EvoucherService) { }

  @Permissions('evoucher:create')
  @CacheKey('evoucher:invalidate')
  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Body() createEvoucherDto: CreateEvoucherDto) {
    return this.evoucherService.create(createEvoucherDto);
  }

  @Permissions('evoucher:read')
  @CacheKey('evoucher:invalidate')
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherService.findAll(query);
  }

  @Permissions('evoucher:read')
  @CacheKey('evoucher:invalidate')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherService.findOne(id);
  }

  @Permissions('evoucher:update')
  @CacheKey('evoucher:invalidate')
  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateEvoucherDto;
    dto.updatedAt = new Date();
    return this.evoucherService.update(id, dto);
  }

  @Permissions('evoucher:delete')
  @CacheKey('evoucher:invalidate')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherService.remove(id);
  }
}
