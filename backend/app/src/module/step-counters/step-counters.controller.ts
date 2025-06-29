import { Controller, Get, Post, Body, Param, Delete, Query, BadRequestException, Req } from '@nestjs/common';
import { StepCountersService } from './step-counters.service';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { FastifyRequest } from 'fastify';
import { Types } from 'mongoose';

@Controller('step-counters')
export class StepCountersController {
  constructor(private readonly stepCountersService: StepCountersService) { }

  @Post()
  create(@Body() createStepCounterDto: CreateStepCounterDto) {
    return this.stepCountersService.create(createStepCounterDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.stepCountersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stepCountersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stepCountersService.remove(id);
  }

  @Get('leaderboard/all')
  getAllLeaderBorad(@Query('limit') limit?: number) {
    return this.stepCountersService.getLeaderboard(limit);
  }

  @Get('leaderboard/by-date')
  async getDailyLeaderboard(@Query('date') date: string) {
    if (!date) {
      throw new BadRequestException('Query parameter "date" is required');
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }

    return await this.stepCountersService.getDailyLeaderboard(parsedDate);
  }

  @Get('leaderboard/by-school')
  async getLeaderboardBySchoolId(@Query('schoolId') schoolId: string) {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    return this.stepCountersService.getLeaderboardBySchoolId(schoolId);
  }

  @Get('leaderboard/by-school-and-date')
  async getLeaderboardBySchoolAndDate(
    @Query('schoolId') schoolId: string,
    @Query('date') dateStr: string,
  ) {
    if (!schoolId || !dateStr) {
      throw new BadRequestException('schoolId and date are required');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return this.stepCountersService.getLeaderboardBySchoolAndDate(schoolId, date);
  }

  @Get('leaderboard/by-achieved')
  async getByAchieved(@Query('stepAchievementId') stepAchievementId?: string) {
    return this.stepCountersService.getLeaderBoardByAchieved(stepAchievementId);
  }

  @Get('my-rank')
  getUserRank(
    @Req() req: FastifyRequest & { user: { _id: Types.ObjectId } },
    @Query('scope') scope: 'global' | 'school' | 'achieved' = 'global',
    @Query('stepAchievementId') stepAchievementId?: string,
  ) {
    return this.stepCountersService.getUserRank(req.user._id, scope, stepAchievementId);
  }

}
