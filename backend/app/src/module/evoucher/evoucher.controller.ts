import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EvoucherService } from './evoucher.service';
import { CreateEvoucherDto } from './dto/create-evoucher.dto';
import { UpdateEvoucherDto } from './dto/update-evoucher.dto';

@Controller('evoucher')
export class EvoucherController {
  constructor(private readonly evoucherService: EvoucherService) {}

  @Post()
  create(@Body() createEvoucherDto: CreateEvoucherDto) {
    return this.evoucherService.create(createEvoucherDto);
  }

  @Get()
  findAll() {
    return this.evoucherService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvoucherDto: UpdateEvoucherDto) {
    return this.evoucherService.update(+id, updateEvoucherDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherService.remove(+id);
  }
}
