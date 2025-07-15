import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SystemStatusService } from './system-status.service';
import { CreateSystemStatusDto } from './dto/create-system-status.dto';
import { UpdateSystemStatusDto } from './dto/update-system-status.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('system-status')
export class SystemStatusController {
  constructor(private readonly systemStatusService: SystemStatusService) {}

  @Post()
  create(@Body() createSystemStatusDto: CreateSystemStatusDto) {
    return this.systemStatusService.create(createSystemStatusDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.systemStatusService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('findOne', id);
    return this.systemStatusService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSystemStatusDto: UpdateSystemStatusDto,
  ) {
    return this.systemStatusService.update(id, updateSystemStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemStatusService.remove(id);
  }
}
