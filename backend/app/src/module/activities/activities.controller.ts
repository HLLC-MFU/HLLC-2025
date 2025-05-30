import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivitiesDto: CreateActivitiesDto) {
    return this.activitiesService.create(createActivitiesDto);
  }

  @Public()
  @Get()
  async getActivitiesForUser(
    @Query() query: Record<string, string>,
    @Req() req: FastifyRequest & { user?: { _id: string } },
  ) {
    const userId = req.user?._id;
    return this.activitiesService.findAllForUser(query, userId);
  }

  @Get('admin')
  @Permissions('activities:read')
  async getActivitiesForAdmin(
    @Query() query: Record<string, string>,
  ) {
    return this.activitiesService.findAllForAdmin(query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: FastifyRequest & { user?: { _id: string } },
  ) {
    const userId = req.user?._id;
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
