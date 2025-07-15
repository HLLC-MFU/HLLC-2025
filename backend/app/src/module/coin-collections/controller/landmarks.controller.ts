import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { LandmarksService } from '../service/landmarks.service';
import { CreateLandmarkDto } from '../dto/ladmarks/create-landmark.dto';
import { UpdateLandmarkDto } from '../dto/ladmarks/update-landmark.dto';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';

@UseGuards(PermissionsGuard)
@ApiTags('landmarks')
@Controller('landmarks')
export class LandmarksController {
  constructor(private readonly landmarksService: LandmarksService) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateLandmarkDto;
    return this.landmarksService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.landmarksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.landmarksService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateLandmarkDto;
    return this.landmarksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.landmarksService.remove(id);
  }
}
