import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { MapsService } from '../service/maps.service';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UpdateMapDto } from '../../coin-collections/dto/maps/update-map.dto';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { CreateMapDto } from '../../coin-collections/dto/maps/create-map.dto';
import { Public } from 'src/module/auth/decorators/public.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('maps')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Post()
  @Permissions('maps:create')
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateMapDto;
    return this.mapsService.create(dto);
  }

  @Get()
  @Public()
  findAll(@Query() query: Record<string, string>) {
    return this.mapsService.findAll(query);
  }

  @Get(':id')
  @Permissions('maps:read')
  findOne(@Param('id') id: string) {
    return this.mapsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('maps:update')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateMapDto;
    return this.mapsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('maps:delete')
  remove(@Param('id') id: string) {
    return this.mapsService.remove(id);
  }
}
