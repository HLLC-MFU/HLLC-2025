import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { LandmarksService } from './landmarks.service';
import { CreateLandmarkDto } from './dto/create-landmark.dto';
import { UpdateLandmarkDto } from './dto/update-landmark.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('landmarks')
@Controller('landmarks')
export class LandmarksController {
  constructor(private readonly landmarksService: LandmarksService) { }

  @Post()
  @Permissions('landmarks:create')
  create(@Body() createLandmarkDto: CreateLandmarkDto) {
    return this.landmarksService.create(createLandmarkDto);
  }

  @Get()
  @Permissions('landmarks:read')
  findAll(@Query() query: Record<string, string>) {
    return this.landmarksService.findAll(query);
  }

  @Get(':id')
  @Permissions('landmarks:read')
  findOne(@Param('id') id: string) {
    return this.landmarksService.findOne(id);
  }

  @Patch(':id')
  @Permissions('landmarks:update')
  update(@Param('id') id: string, @Body() updateLandmarkDto: UpdateLandmarkDto) {
    return this.landmarksService.update(id, updateLandmarkDto);
  }

  @Delete(':id')
  @Permissions('landmarks:delete')
  remove(@Param('id') id: string) {
    return this.landmarksService.remove(id);
  }
}
