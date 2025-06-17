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
import { MajorsService } from './majors.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('majors')
export class MajorsController {
  constructor(private readonly majorsService: MajorsService) {}

  @Post()
  @Permissions('majors:create')
  create(@Body() createMajorDto: CreateMajorDto) {
    createMajorDto.createdAt = new Date();
    return this.majorsService.create(createMajorDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.majorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.majorsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('majors:update')
  update(@Param('id') id: string, @Body() updateMajorDto: UpdateMajorDto) {
    return this.majorsService.update(id, updateMajorDto);
  }

  @Delete(':id')
  @Permissions('majors:delete')
  remove(@Param('id') id: string) {
    return this.majorsService.remove(id);
  }
}
