import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, Req, UnauthorizedException } from '@nestjs/common';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { EvoucherCodeService } from '../service/evoucher-code.service';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';
import { Permissions } from 'src/module/auth/decorators/permissions.decorator';
import { CacheKey } from '@nestjs/cache-manager';
import { Public } from 'src/module/auth/decorators/public.decorator';
import { FastifyRequest } from 'fastify';

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

  @Get('evouchers/available')
  @Public()
  @CacheKey('users:evouchers:available:$req.user')
  getAvailableEvouchers(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } }
  ) {
    const user = req.user;
    const userId = user?._id ?? user?.id;
    
    return this.evoucherCodeService.getPublicAvailableEvouchersForUser(userId);
  }

  @Post('evouchers/claim/:evoucherId')
  @Public()
  claimEvoucher(
    @Param('evoucherId') evoucherId: string,
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } }
  ) {
    const user = req.user;
    const userId = user?._id ?? user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    return this.evoucherCodeService.claimEvoucher(userId, evoucherId);
  }

  @Get('evouchers/my-codes')
  @Public()
  @CacheKey('users:evouchers:codes:$req.user')
  getMyEvoucherCodes(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } }
  ) {
    const user = req.user;
    const userId = user?._id ?? user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    return this.evoucherCodeService.getUserEvoucherCodes(userId);
  }
}
