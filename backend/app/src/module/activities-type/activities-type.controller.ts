import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ActivitiesTypeService } from './activities-type.service';
import { CreateActivitiesTypeDto } from './dto/create-activities-type.dto';
import { UpdateActivitiesTypeDto } from './dto/update-activities-type.dto';

@Controller('activities-type')
export class ActivitiesTypeController {
  constructor(private readonly activitiesTypeService: ActivitiesTypeService) {}

  @Post()
  create(@Body() createActivitiesTypeDto: CreateActivitiesTypeDto) {
    return this.activitiesTypeService.create(createActivitiesTypeDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.activitiesTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActivitiesTypeDto: UpdateActivitiesTypeDto) {
    return this.activitiesTypeService.update(id, updateActivitiesTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesTypeService.remove(id);
  }
}
