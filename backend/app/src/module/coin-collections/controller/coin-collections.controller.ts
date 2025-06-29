import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { CoinCollectionsService } from '../service/coin-collections.service';
import { CreateCoinCollectionDto } from '../dto/coin-collections/create-coin-collection.dto';
import { FastifyRequest } from 'fastify';
import { Types } from 'mongoose';

@Controller('coin-collections')
export class CoinCollectionsController {
  constructor(
    private readonly coinCollectionsService: CoinCollectionsService,
  ) { }

  @Post('collect')
  async collectCoin(@Body() createCoinCollectionDto: CreateCoinCollectionDto) {
    return this.coinCollectionsService.collectCoin(createCoinCollectionDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.coinCollectionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coinCollectionsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coinCollectionsService.remove(id);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query() query: Record<string, string>) {
    return await this.coinCollectionsService.getLeaderboard(query);
  }

  @Get('my-rank')
  async getUserRank(@Req() req: FastifyRequest & { user: { _id: Types.ObjectId } }) {
    return this.coinCollectionsService.getUserRank(req.user._id.toString());
  }

  @Get('sponsor-reward')
  getSponsorRewardUsers(@Query('landmarkId') landmarkId: string) {
    return this.coinCollectionsService.getSponsorRewardUsers(landmarkId);
  }

  @Get('my-coin')
  getMyCoin(@Req() req: FastifyRequest & { user: { _id: Types.ObjectId } }) {
    return this.coinCollectionsService.myCoin(req.user._id)
  }
}
