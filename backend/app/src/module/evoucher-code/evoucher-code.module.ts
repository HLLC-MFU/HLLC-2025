import { Module } from '@nestjs/common';
import { EvoucherCodeService } from './evoucher-code.service';
import { EvoucherCodeController } from './evoucher-code.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EvoucherCode, EvoucherCodeSchema } from './schema/evoucher-code.schema';
import { EvoucherModule } from '../evoucher/evoucher.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EvoucherCode.name,
        schema: EvoucherCodeSchema
      }
    ]),
  ],
  exports: [MongooseModule],
  controllers: [EvoucherCodeController],
  providers: [EvoucherCodeService],
})
export class EvoucherCodeModule {}
