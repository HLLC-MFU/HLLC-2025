import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
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
  constructor(private readonly evoucherCodeService: EvoucherCodeService) {}

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
  update(
    @Param('id') id: string,
    @Body() updateEvoucherCodeDto: UpdateEvoucherCodeDto,
  ) {
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
    @Req() req: FastifyRequest & { user?: { _id?: Types.ObjectId | string } },
  ) {
    const user = req.user as { _id?: Types.ObjectId | string } | undefined;
    let userId: string | undefined;
    if (user && user._id) {
      if (typeof user._id === 'string') {
        userId = user._id;
      } else if (
        typeof user._id === 'object' &&
        typeof user._id.toString === 'function'
      ) {
        userId = user._id.toString();
      }
    }
    if (!userId) {
      throw new Error('User ID is missing or invalid');
    }
    return this.evoucherCodeService.claimEvoucher(userId, evoucherId);
  }

  @Get('my-codes')
  getMyEvoucherCodes(
    @Req() req: FastifyRequest & { user?: { _id?: Types.ObjectId | string } },
  ) {
    const user = req.user as { _id?: Types.ObjectId | string } | undefined;
    let userId: string | undefined;
    if (user && user._id) {
      if (typeof user._id === 'string') {
        userId = user._id;
      } else if (
        typeof user._id === 'object' &&
        typeof user._id.toString === 'function'
      ) {
        userId = user._id.toString();
      }
    }
    if (!userId) {
      throw new Error('User ID is missing or invalid');
    }
    return this.evoucherCodeService.getUserEvoucherCodes(userId);
  }

  @Post('use/:codeId')
  useEvoucherCode(
    @Param('codeId') codeId: string,
    @Req() req: FastifyRequest & { user?: { _id?: Types.ObjectId | string } },
  ) {
    const user = req.user as { _id?: Types.ObjectId | string } | undefined;
    let userId: string | undefined;
    if (user && user._id) {
      if (typeof user._id === 'string') {
        userId = user._id;
      } else if (
        typeof user._id === 'object' &&
        typeof user._id.toString === 'function'
      ) {
        userId = user._id.toString();
      }
    }
    if (!userId) {
      throw new Error('User ID is missing or invalid');
    }
    return this.evoucherCodeService.useEvoucherCode(
      new Types.ObjectId(userId),
      codeId,
    );
  }
}
