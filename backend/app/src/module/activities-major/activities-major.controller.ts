import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActivitiesMajorService } from './activities-major.service';
import { CreateActivitiesMajorDto } from './dto/create-activities-major.dto';
import { UpdateActivitiesMajorDto } from './dto/update-activities-major.dto';

@Controller('activities-major')
export class ActivitiesMajorController {
  constructor(private readonly activitiesMajorService: ActivitiesMajorService) {}

  @Post()
  create(@Body() createActivitiesMajorDto: CreateActivitiesMajorDto) {
    return this.activitiesMajorService.create(createActivitiesMajorDto);
  }

  @Get()
  findAll() {
    return this.activitiesMajorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesMajorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActivitiesMajorDto: UpdateActivitiesMajorDto) {
    return this.activitiesMajorService.update(+id, updateActivitiesMajorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesMajorService.remove(+id);
  }
}
