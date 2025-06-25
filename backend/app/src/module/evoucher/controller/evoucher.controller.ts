import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import { EvoucherService } from '../service/evoucher.service';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { Permissions } from 'src/module/auth/decorators/permissions.decorator';

@Controller('evoucher')
@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
export class EvoucherController {
  constructor(private readonly evoucherService: EvoucherService) {}

  @Permissions('evoucher:create')
  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Body() createEvoucherDto: CreateEvoucherDto) {
    return this.evoucherService.create(createEvoucherDto);
  }

  @Permissions('evoucher:read')
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherService.findAll(query);
  }

  @Permissions('evoucher:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherService.findOne(id);
  }

  @Get('available')
  getAvailableEvouchers(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
  ) {
    const user = req.user;
    const userId = user?._id ?? user?.id;

    return this.evoucherService.getPublicAvailableEvouchersForUser(userId);
  }

  @Permissions('evoucher:update')
  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  async update(@Param('id') id: string, @Body() dto: UpdateEvoucherDto) {
    return this.evoucherService.update(id, dto);
  }

  @Permissions('evoucher:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherService.remove(id);
  }
}
