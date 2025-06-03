import { Module } from '@nestjs/common';
import { EvoucherService } from './evoucher.service';
import { EvoucherController } from './evoucher.controller';

@Module({
  controllers: [EvoucherController],
  providers: [EvoucherService],
})
export class EvoucherModule {}
