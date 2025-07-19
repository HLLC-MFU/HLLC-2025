import { Controller, Get, Post, Body, Delete } from '@nestjs/common';
import { VersionSettingService } from './version-setting.service';
import { UpdateVersionSettingDto } from './dto/update-version-setting.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('version-setting')
export class VersionSettingController {
  constructor(private readonly versionSettingService: VersionSettingService) {}

  @Post()
  create(@Body() updateVersionSettingDto: UpdateVersionSettingDto) {
    return this.versionSettingService.createOrUpdate(updateVersionSettingDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.versionSettingService.find();
  }

  @Delete()
  remove() {
    return this.versionSettingService.remove();
  }
}
