import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AppearancesService } from './appearances.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyRequest } from 'fastify';
import { AppearanceMultipartInterceptor } from './interceptors/appearance-multipart.interceptor';
import { CreateAppearanceDto } from './dto/create-appearance.dto';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller('appearances')
export class AppearancesController {
  constructor(private readonly appearancesService: AppearancesService) {}

  @UseInterceptors(new AppearanceMultipartInterceptor(500))
  @Post()
  @Permissions('appearance:create')
  async create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateAppearanceDto;
    return this.appearancesService.create(dto);
  }

  @Public()
  @Get()
  findAll(query: Record<string, string>) {
    return this.appearancesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appearancesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('appearance:update')
  @UseInterceptors(new AppearanceMultipartInterceptor(500))
  async update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateAppearanceDto;
    return this.appearancesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('appearance:delete')
  remove(@Param('id') id: string) {
    return this.appearancesService.remove(id);
  }
}
