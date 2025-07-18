import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { Checkin } from './schema/checkin.schema';
import { UserRequest } from 'src/pkg/types/users';

@Controller('checkins')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) { }

  @Post()
  async create(
    @Body() createCheckinDto: CreateCheckinDto,
    @Req() req: UserRequest,
  ): Promise<Checkin[]> {
    try {
      const user = req.user as { _id?: string } | undefined;
      const staffId = user?._id;
      if (!staffId) throw new BadRequestException('Unauthorized');

      return await this.checkinService.create({
        ...createCheckinDto,
        staff: staffId,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Check-in failed';
      throw new BadRequestException(message);
    }
  }

  @Get()
  async findAll(@Query() query: Record<string, string>) {
    return await this.checkinService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.checkinService.findOne(id);
  }

  @Get('users')
  async findAllByActivities(@Query('activityId') activityId: string) {
    return await this.checkinService.findAllByActivities(activityId);
  }
}
