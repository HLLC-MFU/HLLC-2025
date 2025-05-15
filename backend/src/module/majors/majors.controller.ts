import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MajorsService } from './majors.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';

@Controller('majors')
export class MajorsController {
  constructor(private readonly majorsService: MajorsService) {}

  @Post()
  create(@Body() createMajorDto: CreateMajorDto) {
    createMajorDto.createdAt = new Date()
    return this.majorsService.create(createMajorDto);
  }

  @Get()
  findAll() {
    return this.majorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.majorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMajorDto: UpdateMajorDto) {
    updateMajorDto.updatedAt = new Date()
    return this.majorsService.update(id, updateMajorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.majorsService.remove(id);
  }
}
