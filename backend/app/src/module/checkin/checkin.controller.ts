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
  Request,
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRequest } from 'src/pkg/types/users';

@Controller('checkin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) { }

  @Post()
  @Permissions('checkin:create')
  async create(
    @Request() req: UserRequest,
    @Body() createCheckinDto: CreateCheckinDto,
  ) {

    createCheckinDto.staff = req.user._id;

    return this.checkinService.create(createCheckinDto);
  }

  @Get()
  @Permissions('checkin:read')
  findAll(@Query() query: Record<string, string>) {
    return this.checkinService.findAll(query);
  }

  @Get(':id')
  @Permissions('checkin:read')
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