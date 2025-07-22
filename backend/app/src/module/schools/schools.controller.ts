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
import { ApiTags } from '@nestjs/swagger';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';

@UseGuards(PermissionsGuard)
@ApiTags('schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) { }

  @UseInterceptors(new MultipartInterceptor())
  @Post()
  @Permissions('schools:create')
  create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
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
    const school = req.body as UpdateSchoolDto;
    if (!school) {
      throw new Error('School data is required for update');
    }
    return this.schoolsService.update(id, school);
  }

  @Delete(':id')
  @Permissions('schools:delete')
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }

  @Get(':id/appearances')
  findAppearance(
    @Param('id') id: string,
    @Query() query: Record<string, string>,
  ) {
    return this.schoolsService.findAppearance(id, query);
  }
}
