import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { ApiTags } from '@nestjs/swagger';

// @UseGuards(PermissionsGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) { }

  @Post()
  @Permissions('schools:create')
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateSchoolDto;
    return this.schoolsService.create(dto);
  }

  @Get()
  @Permissions('schools:read')
  findAll(@Query() query: Record<string, string>) {
    return this.schoolsService.findAll(query);
  }
  

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('schools:update')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateSchoolDto;
    dto.updatedAt = new Date();
    return this.schoolsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('schools:delete')
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}