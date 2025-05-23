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
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('checkin')
@UseGuards(PermissionsGuard)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  @Permissions('checkin:create')
  create(@Body() createCheckinDto: CreateCheckinDto) {
    return this.checkinService.create(createCheckinDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.checkinService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkinService.findOne(id);
  }

  @Patch(':id')
  @Permissions('checkin:update')
  update(@Param('id') id: string, @Body() updateCheckinDto: UpdateCheckinDto) {
    return this.checkinService.update(id, updateCheckinDto);
  }

  @Delete(':id')
  @Permissions('checkin:delete')
  remove(@Param('id') id: string) {
    return this.checkinService.remove(id);
  }
}
