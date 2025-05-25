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
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Permissions('activities:create')
  create(@Body() createActivitiesDto: CreateActivitiesDto) {
    return this.activitiesService.create(createActivitiesDto);
  }

  @Get()
  @Permissions('activities:read')
  findAll(@Query() query: Record<string, string>) {
    return this.activitiesService.findAll(query);
  }

  @Get(':id')
  @Permissions('activities:read')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('activities:update')
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @Permissions('activities:delete')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
