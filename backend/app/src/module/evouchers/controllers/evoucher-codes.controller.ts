import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  Req,
} from '@nestjs/common';
import { EvoucherCodesService } from '../services/evoucher-codes.service';
import { UpdateEvoucherCodeDto } from '../dto/update-evouchercodes.dto';
import { FastifyRequest } from 'fastify';
import { Types } from 'mongoose';

@Controller('evoucher-codes')
export class EvoucherCodesController {
  constructor(private readonly evoucherCodesService: EvoucherCodesService) { }
  @Get()
  findAll() {
    return this.evoucherCodesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherCodesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEvoucherCodeDto) {
    return this.evoucherCodesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherCodesService.remove(id);
  }

  @Post(':id/generate-codes')
  generateCodes(@Param('id') id: string) {
    return this.evoucherCodesService.generateCodesForEvoucher(id);
  }

  @Post(':id/used')
  used(@Param('id') id: string, @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } }) {
    return this.evoucherCodesService.useEvoucher(id);
  }

  @Get('my-code')
  getMyEvoucherCodes(
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } }) {
    return this.evoucherCodesService.getUserEvoucherCodes(req.user._id);
  }
}
