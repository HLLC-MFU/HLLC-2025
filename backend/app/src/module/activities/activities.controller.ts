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
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { UserRequest } from 'src/pkg/types/users';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@UseGuards(PermissionsGuard)
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

  @Get('')
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() query: Record<string, string>,
    @Req() req: UserRequest,
  ) {
    return this.activitiesService.findAll(query, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @Req() req: UserRequest,
  ) {
    return this.activitiesService.findOne(id, req.user._id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(new MultipartInterceptor(500))
  update(
    @Param('id') id: string,
    @Req() req: UserRequest,
  ) {
    const dto = req.body as UpdateActivityDto;
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}