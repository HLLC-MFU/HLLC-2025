import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  BadRequestException,
  Req,
  Patch,
  Logger,
} from '@nestjs/common';
import { StepCountersService } from '../service/step-counters.service';
import { FastifyRequest } from 'fastify';
import { apiResponse } from 'src/pkg/helper/api-response.helper';
import { Public } from 'src/module/auth/decorators/public.decorator';

class RegisterDeviceDto {
  deviceId: string;
}

class UpdateDeviceDto {
  deviceId: string;
}

class CollectStepDto {
  deviceId: string;
  stepCount: number;
  date: string; // ISO string or date string
}

@Controller('step-counters')
export class StepCountersController {
  constructor(private readonly stepCountersService: StepCountersService) { }

  @Get()
  getUserStep(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
  ) {
    const user = req.user as { _id?: string; id?: string };
    const userId: string = user?._id ?? user?.id ?? '';
    return this.stepCountersService.getRegisteredDevices(userId);
  }

  // ลงทะเบียน device ใหม่
  @Post('device')
  async registerDevice(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
    @Body() body: RegisterDeviceDto,
  ) {
    const { deviceId } = body;
    const user = req.user as { _id?: string; id?: string };
    const userId: string = user?._id ?? user?.id ?? '';
    if (!req || !deviceId) {
      throw new BadRequestException('Missing userId or deviceId');
    }
    return this.stepCountersService.registerDevice(userId, deviceId);
  }

  // อัปเดต device id ของ user
  @Patch('device')
  async updateDevice(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
    @Body() body: UpdateDeviceDto,
  ) {
    const user = req.user as { _id?: string; id?: string };
    const userId: string = user?._id ?? user?.id ?? '';
    const { deviceId } = body;
    if (!userId || !deviceId) {
      throw new BadRequestException('Missing userId or deviceId');
    }
    return this.stepCountersService.updateDevice(userId, deviceId);
  }

  // อัปเดตหรือเพิ่ม step ของ device และ user ตามวันที่
  @Post('sync')
  async collectStep(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
    @Body() body: CollectStepDto,
  ) {
    const logger = new Logger('StepCounterController');

    const user = req.user as { _id?: string; id?: string };
    const userId: string = user?._id ?? user?.id ?? '';
    const { deviceId, stepCount, date } = body;


    if (!userId || !deviceId || stepCount == null || !date) {
      logger.warn(
        `Missing fields: userId=${userId}, deviceId=${deviceId}, stepCount=${stepCount}, date=${date}`,
      );
      throw new BadRequestException(
        'Missing userId, deviceId, stepCount, or date',
      );
    }

    const result = await this.stepCountersService.collectStep(
      userId,
      deviceId,
      stepCount,
      date,
    );

    logger.debug(`Step collection successful for userId=${userId}`);

    return result;
  }

  // ดึง leaderboard
  // ตัวอย่าง query: ?scope=all&page=1&pageSize=10
  // หรือ ?scope=school&schoolId=xxx&page=1&pageSize=10
  // หรือ ?scope=date&date=2025-07-03&page=1&pageSize=10
  @Get('leaderboard')
  async leaderboard(
    @Query('scope') scope: 'all' | 'school' | 'date' = 'all',
    @Query('schoolId') schoolId?: string,
    @Query('date') date?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    return this.stepCountersService.leaderboard(scope, {
      schoolId,
      date,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  }

  @Get('leaderboard/user')
  async getUserRankSummary(
    @Req() req: FastifyRequest & { user?: { _id?: string; id?: string } },
  ) {
    const user = req.user as { _id?: string; id?: string };
    const userId: string = user?._id ?? user?.id ?? '';

    try {
      const result = await this.stepCountersService.getUserRankSummary(userId);
      return apiResponse(result, "Successfully retrieved user's rank summary", 200);
    } catch (error) {
      console.error('[controller] error:', error);
      throw new BadRequestException('Failed to retrieve user rank summary');
    }
  }

}
