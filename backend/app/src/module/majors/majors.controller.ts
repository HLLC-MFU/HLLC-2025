import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MajorsService } from './majors.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AutoCacheInterceptor } from 'src/pkg/cache/auto-cache.interceptor';

@UseGuards(PermissionsGuard)
@UseInterceptors(AutoCacheInterceptor)
@Controller('majors')
export class MajorsController {
  constructor(private readonly majorsService: MajorsService) {}

  @Post()
  @Permissions('majors:create')
  create(@Body() createMajorDto: CreateMajorDto) {
    return this.majorsService.create(createMajorDto);
  }

  @Get()
  @Permissions('majors:read')
  findAll(@Query() query: Record<string, string>) {
    return this.majorsService.findAll(query);
  }

  @Get(':id')
  @Permissions('majors:read')
  findOne(@Param('id') id: string) {
    return this.majorsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('majors:update')
  update(@Param('id') id: string, @Body() updateMajorDto: UpdateMajorDto) {
    updateMajorDto.updatedAt = new Date();
    return this.majorsService.update(id, updateMajorDto);
  }

  @Delete(':id')
  @Permissions('majors:delete')
  remove(@Param('id') id: string) {
    return this.majorsService.remove(id);
  }
}
