import { Module } from '@nestjs/common';
import { EvoucherCodesController } from './controllers/evoucher-codes.controller';
import { EvouchersController } from './controllers/evouchers.controller';
import { EvouchersService } from './services/evouchers.service';
import { EvoucherCodesService } from './services/evoucher-codes.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Evoucher, EvoucherSchema } from './schemas/evoucher.schema';
import {
  EvoucherCode,
  EvoucherCodeSchema,
} from './schemas/evoucher-code.schema';
import { Sponsors, SponsorsSchema } from '../sponsors/schemas/sponsors.schema';
import { SponsorsModule } from '../sponsors/sponsors.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Evoucher.name,
        schema: EvoucherSchema,
      },
      {
        name: EvoucherCode.name,
        schema: EvoucherCodeSchema,
      },
      {
        name: Sponsors.name,
        schema: SponsorsSchema,
      },
    ]),
    SponsorsModule,
  ],
  controllers: [EvoucherCodesController, EvouchersController],
  providers: [EvouchersService, EvoucherCodesService],
})
export class EvouchersModule {}
