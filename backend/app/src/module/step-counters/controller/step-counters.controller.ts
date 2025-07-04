import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  BadRequestException,
  Req,
  Patch,
} from '@nestjs/common';
import { StepCountersService } from '../service/step-counters.service';
import { FastifyRequest } from 'fastify';

class RegisterDeviceDto {
  deviceId: string;
}

class UpdateDeviceDto {
  userId: string;
  deviceId: string;
}

class CollectStepDto {
  userId: string;
  deviceId: string;
  stepCount: number;
  date: string; // ISO string or date string
}

@Controller('step-counters')
export class StepCountersController {
  constructor(private readonly stepCountersService: StepCountersService) {}

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
  async updateDevice(@Body() body: UpdateDeviceDto) {
    const { userId, deviceId } = body;
    if (!userId || !deviceId) {
      throw new BadRequestException('Missing userId or deviceId');
    }
    return this.stepCountersService.updateDevice(userId, deviceId);
  }

  // อัปเดตหรือเพิ่ม step ของ device และ user ตามวันที่
  @Post('collect-step')
  async collectStep(@Body() body: CollectStepDto) {
    const { userId, deviceId, stepCount, date } = body;
    if (!userId || !deviceId || stepCount == null || !date) {
      throw new BadRequestException(
        'Missing userId, deviceId, stepCount, or date',
      );
    }
    return this.stepCountersService.collectStep(
      userId,
      deviceId,
      stepCount,
      date,
    );
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
}

// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Param,
//   Delete,
//   Query,
//   BadRequestException,
//   Req,
// } from '@nestjs/common';
// import { StepCountersService } from '../service/step-counters.service';
// import { CreateStepCounterDto } from '../dto/step-counters/create-step-counter.dto';
// import { FastifyRequest } from 'fastify';
// import { Types } from 'mongoose';

// @Controller('step-counters')
// export class StepCountersController {
//   constructor(private readonly stepCountersService: StepCountersService) {}

//   @Post()
//   create(@Body() createStepCounterDto: CreateStepCounterDto) {
//     return this.stepCountersService.create(createStepCounterDto);
//   }

//   @Get()
//   findAll(@Query() query: Record<string, string>) {
//     return this.stepCountersService.findAll(query);
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.stepCountersService.findOne(id);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.stepCountersService.remove(id);
//   }

//   @Get('leaderboard/all')
//   getAllLeaderBorad(@Query('limit') limit?: number) {
//     return this.stepCountersService.getLeaderboard(limit);
//   }

//   @Get('leaderboard/by-date')
//   async getDailyLeaderboard(@Query('date') date: string) {
//     if (!date) {
//       throw new BadRequestException('Query parameter "date" is required');
//     }

//     const parsedDate = new Date(date);
//     if (isNaN(parsedDate.getTime())) {
//       throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
//     }

//     return await this.stepCountersService.getDailyLeaderboard(parsedDate);
//   }

//   @Get('leaderboard/by-school')
//   async getLeaderboardBySchoolId(@Query('schoolId') schoolId: string) {
//     if (!schoolId) {
//       throw new BadRequestException('schoolId is required');
//     }

//     return this.stepCountersService.getLeaderboardBySchoolId(schoolId);
//   }

//   @Get('leaderboard/by-school-and-date')
//   async getLeaderboardBySchoolAndDate(
//     @Query('schoolId') schoolId: string,
//     @Query('date') dateStr: string,
//   ) {
//     if (!schoolId || !dateStr) {
//       throw new BadRequestException('schoolId and date are required');
//     }

//     const date = new Date(dateStr);
//     if (isNaN(date.getTime())) {
//       throw new BadRequestException('Invalid date format');
//     }

//     return this.stepCountersService.getLeaderboardBySchoolAndDate(
//       schoolId,
//       date,
//     );
//   }

//   @Get('leaderboard/by-achieved')
//   async getByAchieved(@Query('stepAchievementId') stepAchievementId?: string) {
//     return this.stepCountersService.getLeaderBoardByAchieved(stepAchievementId);
//   }

//   @Get('my-rank')
//   getUserRank(
//     @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } },
//     @Query('scope') scope: 'global' | 'school' | 'achieved' = 'global',
//     @Query('stepAchievementId') stepAchievementId?: string,
//   ) {
//     return this.stepCountersService.getUserRank(
//       req.user._id,
//       scope,
//       stepAchievementId,
//     );
//   }
// }
