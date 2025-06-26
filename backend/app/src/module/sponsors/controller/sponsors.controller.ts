import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { SponsorsService } from '../service/sponsors.service';
import { CreateSponsorDto } from '../dto/sponsers/create-sponsor.dto';
import { UpdateSponsorDto } from '../dto/sponsers/update-sponsor.dto';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';

@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateSponsorDto;
    return this.sponsorsService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.sponsorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sponsorsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateSponsorDto;
    return this.sponsorsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sponsorsService.remove(id);
  }
}
