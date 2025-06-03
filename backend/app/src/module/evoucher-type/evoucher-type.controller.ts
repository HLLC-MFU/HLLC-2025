import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EvoucherTypeService } from './evoucher-type.service';
import { CreateEvoucherTypeDto } from './dto/create-evoucher-type.dto';
import { UpdateEvoucherTypeDto } from './dto/update-evoucher-type.dto';

@Controller('evoucher-type')
export class EvoucherTypeController {
  constructor(private readonly evoucherTypeService: EvoucherTypeService) {}

  @Post()
  create(@Body() createEvoucherTypeDto: CreateEvoucherTypeDto) {
    return this.evoucherTypeService.create(createEvoucherTypeDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvoucherTypeDto: UpdateEvoucherTypeDto) {
    return this.evoucherTypeService.update(id, updateEvoucherTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherTypeService.remove(id);
  }
}
