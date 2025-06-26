import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EvouchersService } from '../services/evouchers.service';
import { CreateEvoucherDto } from '../dto/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/update-evoucher.dto';

@Controller('evouchers')
export class EvouchersController {
  constructor(private readonly evouchersService: EvouchersService) {}

  @Post()
  create(@Body() createDto: CreateEvoucherDto) {
    return this.evouchersService.create(createDto);
  }

  @Get()
  findAll() {
    return this.evouchersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evouchersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEvoucherDto) {
    return this.evouchersService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evouchersService.remove(id);
  }
}
