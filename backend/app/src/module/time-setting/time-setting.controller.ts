import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TimeSettingService } from './time-setting.service';
import { CreateTimeSettingDto } from './dto/create-time-setting.dto';
import { UpdateTimeSettingDto } from './dto/update-time-setting.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('time-setting')
@Controller('time-setting')
export class TimeSettingController {
  constructor(private readonly timeSettingService: TimeSettingService) { }

  @Post()
  create(@Body() createTimeSettingDto: CreateTimeSettingDto) {
    return this.timeSettingService.create(createTimeSettingDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.timeSettingService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timeSettingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimeSettingDto: UpdateTimeSettingDto) {
    return this.timeSettingService.update(id, updateTimeSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timeSettingService.remove(id);
  }
}
