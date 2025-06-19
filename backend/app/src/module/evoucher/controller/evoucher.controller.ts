import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  Req,
} from '@nestjs/common';

import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import { EvoucherService } from '../service/evoucher.service';

@Controller('evoucher')
export class EvoucherController {
  constructor(private readonly evoucherService: EvoucherService) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Body() createEvoucherDto: CreateEvoucherDto) {
    return this.evoucherService.create(createEvoucherDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.evoucherService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evoucherService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateEvoucherDto;
    return this.evoucherService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evoucherService.remove(id);
  }
}
