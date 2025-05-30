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

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Public()
  @Post()
  create(@Body() createActivitiesDto: CreateActivitiesDto) {
    return this.activitiesService.create(createActivitiesDto);
  }

  @Get()
  async getActivities(
    @Query() query: Record<string, string>,
    @Req() req: FastifyRequest & { user?: { _id: string } },
  ) {
    console.log('[Controller] 📝 Request user:', req.user);
    const userId = req.user?._id;
    console.log('[Controller] 👤 Extracted userId:', userId);
    return this.activitiesService.findAll(query, userId);
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
