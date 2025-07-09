import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreateLamduanSettingDto } from '../dto/lamduan-settings/create-lamduan-setting.dto';
import { UpdateLamduanSettingDto } from '../dto/lamduan-settings/update-lamduan-setting.dto';
import { LamduanSettingService } from '../service/lamduan-setting.service';

@UseGuards(PermissionsGuard)
@Controller('lamduan-setting')
export class LamduanSettingController {
  constructor(private readonly lamduanSettingService: LamduanSettingService) {}

  @Post()
  @Permissions('lamduan-setting:create')
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Body() createLamduanSettingDto: CreateLamduanSettingDto) {
    return this.lamduanSettingService.create(createLamduanSettingDto);
  }

  @Get()
  @Permissions('lamduan-setting:read')
  findAll(@Query() query: Record<string, string>) {
    return this.lamduanSettingService.findAll(query);
  }

  @Get(':id')
  @Permissions('lamduan-setting:read:id')
  findOne(@Param('id') id: string) {
    return this.lamduanSettingService.findOne(id);
  }

  @Patch(':id')
  @Permissions('lamduan-setting:update')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateLamduanSettingDto;
    return this.lamduanSettingService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('lamduan-setting:delete')
  remove(@Param('id') id: string) {
    return this.lamduanSettingService.remove(id);
  }
}
