import { Request } from 'express';
import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { Checkin } from './schema/checkin.schema';
import { FastifyRequest } from 'fastify';

@Controller('checkins')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  async create(
    @Body() createCheckinDto: CreateCheckinDto,
    @Req() req: FastifyRequest & { user?: { _id?: string } },
  ): Promise<Checkin> {
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
}
