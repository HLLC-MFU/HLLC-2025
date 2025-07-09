import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { UpdateActivityDto } from '../dto/activities/update-activities.dto';
import { FastifyRequest } from 'fastify';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { UserRequest } from 'src/pkg/types/users';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Activities } from '../schemas/activities.schema';
import { PaginatedResponse } from 'src/pkg/interceptors/response.interceptor';
import { Types } from 'mongoose';

@UseGuards(PermissionsGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Permissions('activities:create')
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateActivitiesDto;
    return this.activitiesService.create(dto);
  }

  @Get('')
  @Permissions('activities:read')
  async findAll(@Query() query: Record<string, string>) {
    return this.activitiesService.findAll(query);
  }

  @Get('canCheckin')
  @Permissions('activities:read')
  async canCheckin(): Promise<
    PaginatedResponse<Activities> & { message: string }
  > {
    return this.activitiesService.findCanCheckinActivities();
  }

  @Get('users')
  getActivitiesByUser(
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } },
  ) {
    const user = req.user as { _id: Types.ObjectId };
    return this.activitiesService.findActivitiesByUserId(user._id.toString());
  }

  @Get(':id')
  @Permissions('activities:read')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('activities:update')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: UserRequest) {
    const dto = req.body as UpdateActivityDto;
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('activities:delete')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  @Get(':id/assessment')
  @Permissions('activities:read')
  async findActivitiesWithAssessment(activitiesId: string) {
    return this.activitiesService.findActivitiesWithAssessment(activitiesId);
  }
}
