import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  Req,
  Patch,
  Body,
  Query,
} from '@nestjs/common';
import { EvouchersService } from '../services/evouchers.service';
import {
  AddEvoucherCodeByRoleDto,
  AddEvoucherCodeDto,
  CreateEvoucherDto,
} from '../dto/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/update-evoucher.dto';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { EvoucherCodesService } from '../services/evoucher-codes.service';
import { Types } from 'mongoose';
import { KhantokDto } from '../dto/khantok.dto';

@Controller('evouchers')
export class EvouchersController {
  constructor(
    private readonly evouchersService: EvouchersService,
    private readonly evoucherCodesService: EvoucherCodesService,
  ) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const evoucher = req.body as CreateEvoucherDto;
    return this.evouchersService.create(evoucher);
  }

  @Get()
  findAll(@Query('sponsors') sponsorId?: string) {
    return this.evouchersService.findAll(sponsorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evouchersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const evoucher = req.body as UpdateEvoucherDto;
    if (!evoucher) {
      throw new Error('Evoucher data is required for update');
    }
    return this.evouchersService.update(id, evoucher);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evouchersService.remove(id);
  }

  @Post(':id/claim')
  claim(
    @Param('id') id: string,
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } },
  ) {
    const userId = req.user._id.toString();
    return this.evoucherCodesService.claimEvoucherCode(id, userId);
  }

  @Post(':id/add')
  addEvoucherCode(
    @Param('id') evoucherId: string,
    @Body() addEvoucherCodeDto: AddEvoucherCodeDto,
  ) {
    const { userId } = addEvoucherCodeDto;
    return this.evoucherCodesService.addEvoucherCode(userId, evoucherId);
  }

  @Post(':id/add-by-role')
  addEvoucherCodeByRole(
    @Param('id') evoucherId: string,
    @Body() addEvoucherCodeByRoleDto: AddEvoucherCodeByRoleDto,
  ) {
    const { roleId } = addEvoucherCodeByRoleDto;
    return this.evoucherCodesService.addEvoucherCodeByRole(roleId, evoucherId);
  }

  @Post(':id/add-khantok')
  addEvoucherCodeKhantok(
    @Param('id') evoucherId: string,
    @Body() dto: KhantokDto,
  ) {
    console.log('Received usernames:', dto.username);
    return this.evoucherCodesService.addEvoucherCodeKhantok(dto.username, evoucherId);
  }

  @Get(":evoucherId/without-evoucher")
  async getUsersNoEvoucher(@Param('evoucherId') evoucherId: string) {
    return this.evoucherCodesService.findUsersWithoutEvoucher(evoucherId);
  }
}
