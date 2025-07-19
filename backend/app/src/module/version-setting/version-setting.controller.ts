import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VersionSettingService } from './version-setting.service';
import { UpdateVersionSettingDto } from './dto/update-version-setting.dto';

@Controller('version-setting')
export class VersionSettingController {
  constructor(private readonly versionSettingService: VersionSettingService) {}

  @Post()
  create(@Body() updateVersionSettingDto: UpdateVersionSettingDto) {
    return this.versionSettingService.createOrUpdate(updateVersionSettingDto);
  }

  @Get()
  findAll() {
    return this.versionSettingService.find();
  }

  @Delete()
  remove() {
    return this.versionSettingService.remove();
  }
}
