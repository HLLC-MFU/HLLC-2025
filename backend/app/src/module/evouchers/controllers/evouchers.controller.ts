import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  Req,
  Patch,
} from '@nestjs/common';
import { EvouchersService } from '../services/evouchers.service';
import { CreateEvoucherDto } from '../dto/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/update-evoucher.dto';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';

@Controller('evouchers')
export class EvouchersController {
  constructor(private readonly evouchersService: EvouchersService) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const evoucher = req.body as CreateEvoucherDto;
    return this.evouchersService.create(evoucher);
  }

  @Get()
  findAll() {
    return this.evouchersService.findAll();
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
}
