import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { RevokeDeviceDto } from './dto/revoke-device.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UserRequest } from 'src/pkg/types/users';

@UseGuards(PermissionsGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  registerDevice(
    @Req() req: UserRequest,
    @Body() dto: RegisterDeviceDto,
  ) {
    const user = req.user;
    return this.devicesService.registerOrUpdate(user._id, dto);
  }

  @Delete('revoke')
  revokeDevice(
    @Req() req: UserRequest,
    @Body() dto: RevokeDeviceDto,
  ) {
    const user = req.user;
    return this.devicesService.revoke(user._id, dto.deviceId);
  }

  @Get('user/:id')
  findByUserId(@Param('id') id: string) {
    return this.devicesService.findByUserId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

}
