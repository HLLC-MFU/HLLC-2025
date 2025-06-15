import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { EvoucherCodeService } from '../service/evoucher-code.service';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { Permissions } from 'src/module/auth/decorators/permissions.decorator';
import { CacheKey } from '@nestjs/cache-manager';
import { FastifyRequest } from 'fastify';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/module/auth/guards/jwt-auth.guard';

@Controller('evoucher-code')
@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
export class EvoucherCodeController {
  constructor(private readonly evoucherCodeService: EvoucherCodeService) { }

  @Permissions('evoucher-code:create')
  @CacheKey('evoucher-code:invalidate')
  @Post()
  create(@Body() createEvoucherCodeDto: CreateEvoucherCodeDto) {
    return this.evoucherCodeService.create(createEvoucherCodeDto);
  }

  @Permissions('evoucher-code:read')
  @CacheKey('evoucher-code:invalidate')
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherCodeService.findAll(query);
  }

  @Permissions('evoucher-code:read')
  @CacheKey('evoucher-code:invalidate')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherCodeService.findOne(id);
  }

  @Permissions('evoucher-code:update')
  @CacheKey('evoucher-code:invalidate')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvoucherCodeDto: UpdateEvoucherCodeDto) {
    return this.evoucherCodeService.update(id, updateEvoucherCodeDto);
  }

  @Permissions('evoucher-code:delete')
  @CacheKey('evoucher-code:invalidate')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherCodeService.remove(id);
  }

  @Post('claim/:evoucherId')
  claimEvoucher(
    @Param('evoucherId') evoucherId: string,
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } }
  ) {
    return this.evoucherCodeService.claimEvoucher(req.user._id, evoucherId);
  }

  @Get('my-codes')
  getMyEvoucherCodes(
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } }
  ) {
    return this.evoucherCodeService.getUserEvoucherCodes(req.user._id);
  }
}
