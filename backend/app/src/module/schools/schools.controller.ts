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
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags } from '@nestjs/swagger';

@UseGuards(PermissionsGuard)
@ApiTags('schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) { }

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
  update(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    updateSchoolDto.updatedAt = new Date();
    return this.schoolsService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  @Permissions('schools:delete')
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}
