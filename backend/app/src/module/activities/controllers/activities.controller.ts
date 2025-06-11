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
  UnauthorizedException,
} from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { UpdateActivityDto } from '../dto/activities/update-activities.dto';
import { FastifyRequest } from 'fastify';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { UserRequest } from 'src/pkg/types/users';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CacheKey } from '@nestjs/cache-manager';

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

  @Get('users')
  @Permissions('activities:read')
  @CacheKey('activities:$req.user.id')
  getActivitiesByUser(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
  ) {
    let userId: string | undefined;
    if (req.user && typeof req.user === 'object') {
      userId =
        (req.user as { _id?: string; id?: string })._id ||
        (req.user as { id?: string }).id;
    }
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.activitiesService.findActivitiesByUserId(userId);
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
}
