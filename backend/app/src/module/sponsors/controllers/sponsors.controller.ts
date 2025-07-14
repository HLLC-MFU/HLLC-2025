import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
  Req,
  Patch,
} from '@nestjs/common';

import { CreateSponsorTypeDto } from '../dto/create-sponsor-type.dto';
import { SponsorsService } from '../services/sponsors.service';
import { UpdateSponsorTypeDto } from '../dto/update-sponsor-type.dto';

import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { CreateSponsorDto } from '../dto/create-sponsor.dto';
import { UpdateSponsorDto } from '../dto/update-sponsor.dto';

@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  // ───── Sponsors Type ─────

  @Post('types')
  createType(@Body() dto: CreateSponsorTypeDto) {
    return this.sponsorsService.createType(dto);
  }

  @Get('types')
  async getAllTypes() {
    return this.sponsorsService.findAllTypes();
  }

  @Patch('types/:id')
  async updateType(@Param('id') id: string, @Body() dto: UpdateSponsorTypeDto) {
    return this.sponsorsService.updateType(id, dto);
  }

  @Delete('types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteType(@Param('id') id: string) {
    await this.sponsorsService.deleteType(id);
  }

  // ───── Sponsors ─────

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  async createSponsor(@Req() req: FastifyRequest) {
    const sponsor = req.body as CreateSponsorDto;
    return this.sponsorsService.createSponsor(sponsor);
  }

  @Get()
  async getAllSponsors() {
    return this.sponsorsService.findAllSponsors();
  }

  @Get(':id')
  async getSponsorById(@Param('id') id: string) {
    return this.sponsorsService.findSponsorById(id);
  }

  @Get('type/:typeId')
  async getSponsorsByType(@Param('typeId') typeId: string) {
    const sponsors = await this.sponsorsService.findSponsorsByType(typeId);
    if (!sponsors.length)
      throw new NotFoundException('No sponsors found for this type');
    return sponsors;
  }

  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  async updateSponsor(@Param('id') id: string, @Req() req: FastifyRequest) {
    const sponsor = req.body as UpdateSponsorDto;
    return this.sponsorsService.updateSponsor(id, sponsor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSponsor(@Param('id') id: string) {
    await this.sponsorsService.deleteSponsor(id);
  }
}
