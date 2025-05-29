import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivitiesDto: CreateActivitiesDto) {
    return this.activitiesService.create(createActivitiesDto);
  }

  @Get()
  findAll(
    @Query() query: Record<string, string>,
    @Query('userId') userId?: string,
  ) {
    return this.activitiesService.findAll(query, userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    return this.activitiesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
