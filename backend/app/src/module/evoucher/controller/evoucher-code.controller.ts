import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { EvoucherCodeService } from '../service/evoucher-code.service';

@Controller('evoucher-code')
export class EvoucherCodeController {
  constructor(private readonly evoucherCodeService: EvoucherCodeService) { }

  // Admin endpoints
  @Post()
  create(@Body() createEvoucherCodeDto: CreateEvoucherCodeDto) {
    return this.evoucherCodeService.create(createEvoucherCodeDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherCodeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherCodeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvoucherCodeDto: UpdateEvoucherCodeDto) {
    return this.evoucherCodeService.update(id, updateEvoucherCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherCodeService.remove(id);
  }
}
