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
  UseInterceptors,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Public()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateActivitiesDto;
    return this.activitiesService.create(dto);
  }


  // @Get('user')
  // async getActivitiesForUserQuery(
  //   @Query() query: Record<string, string>,
  // ) {
  //   return this.activitiesService.findAllUserQuery(query);
  // }

  @Get('')
  @Permissions('activities:read')
  async getActivitiesForAdmin(
    @Query() query: Record<string, string>,
  ) {
    return this.activitiesService.findAll(query);
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
  @UseInterceptors(new MultipartInterceptor(500))
  update(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
  ) {
    const dto = req.body as UpdateActivityDto;
    dto.updatedAt = new Date();
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

    // @Public()
  // @Get()
  // async getActivitiesForUser(
  //   @Query() query: Record<string, string>,
  //   @Req() req: FastifyRequest & { user?: { _id: string } },
  // ) {
  //   const userId = req.user?._id;
  //   return this.activitiesService.findAllForUser(query, userId);
  // }

}
