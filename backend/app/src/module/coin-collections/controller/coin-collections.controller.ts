import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CoinCollectionsService } from '../service/coin-collections.service';
import { CollectCoinDto } from '../dto/coin-collections/coin-collectoin.dto';

@Controller('coin-collections')
export class CoinCollectionsController {
  constructor(
    private readonly coinCollectionsService: CoinCollectionsService,
  ) {}

  @Post('collect')
  async collectCoin(@Body() collectCoinDto: CollectCoinDto) {
    return this.coinCollectionsService.collectCoin(collectCoinDto);
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
  async getLeaderboard(@Query('limit') limit: number) {
    return await this.coinCollectionsService.getLeaderboard(limit);
  }

  @Get(':userId/leaderboard')
  async getUserRank(@Param('userId') userId: string) {
    return await this.coinCollectionsService.getUserRank(userId);
  }
}
