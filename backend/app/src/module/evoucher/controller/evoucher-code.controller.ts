import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { EvoucherCodeService } from '../service/evoucher-code.service';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { Permissions } from 'src/module/auth/decorators/permissions.decorator'; 
import { FastifyRequest } from 'fastify';
import { Types } from 'mongoose';

@Controller('evoucher-code')
@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
export class EvoucherCodeController {
  constructor(private readonly evoucherCodeService: EvoucherCodeService) { }

  @Permissions('evoucher-code:create')
  @Post()
  create(@Body() createEvoucherCodeDto: CreateEvoucherCodeDto) {
    return this.evoucherCodeService.create(createEvoucherCodeDto);
  }

  @Permissions('evoucher-code:read')
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherCodeService.findAll(query);
  }

  @Permissions('evoucher-code:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherCodeService.findOne(id);
  }

  @Permissions('evoucher-code:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvoucherCodeDto: UpdateEvoucherCodeDto) {
    return this.evoucherCodeService.update(id, updateEvoucherCodeDto);
  }

  @Permissions('evoucher-code:delete')
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

  @Post('use/:codeId')
  useEvoucherCode(
    @Param('codeId') codeId: string,
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } }
  ) {
    return this.evoucherCodeService.useEvoucherCode(req.user._id, codeId);
  }
}
