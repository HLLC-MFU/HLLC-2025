import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { UpdateActivityDto } from '../dto/activities/update-activities.dto';
import { FastifyRequest } from 'fastify';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { UserRequest } from 'src/pkg/types/users';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Activities } from '../schemas/activities.schema';
import { PaginatedResponse } from 'src/pkg/interceptors/response.interceptor';
import { Types } from 'mongoose';
import { apiResponse } from 'src/pkg/helper/api-response.helper';

@UseGuards(PermissionsGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateActivitiesDto;
    return this.activitiesService.create(dto);
  }

  @Get('')
  async findAll() {
    const activities = await this.activitiesService.findAll();
    return apiResponse(
      activities,
      'Activities retrieved successfully',
      HttpStatus.OK,
    );
  }

  @Get('canCheckin')
  async canCheckin(
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } },
  ): Promise<PaginatedResponse<Activities> & { message: string }> {
    const user = req.user as { _id: Types.ObjectId };
    return this.activitiesService.findCanCheckinActivities(user._id.toString());
  }

  @Get('user')
  async getActivitiesByUser(
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } },
  ) {
    const user = req.user as { _id: Types.ObjectId };
    const activities = await this.activitiesService.findActivitiesByUserId(
      user._id.toString(),
    );
    return activities;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: UserRequest) {
    const dto = req.body as UpdateActivityDto;
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  @Get(':activityId/assessment')
  async findActivitiesWithAssessment(@Param('activityId') activityId: string) {
    return this.activitiesService.findActivitiesWithAssessment(activityId);
  }
}
