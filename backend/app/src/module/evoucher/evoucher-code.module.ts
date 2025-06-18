import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvoucherCode, EvoucherCodeSchema } from './schema/evoucher-code.schema';
import { User } from '../users/schemas/user.schema';
import { UserSchema } from '../users/schemas/user.schema';
import { EvoucherCodeController } from './controller/evoucher-code.controller';
import { Evoucher, EvoucherSchema } from './schema/evoucher.schema';
import { EvoucherCodeService } from './service/evoucher-code.service';
import { EvoucherCodeSequence, EvoucherCodeSequenceSchema } from './schema/evoucher-code-sequence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EvoucherCode.name,
        schema: EvoucherCodeSchema
      },
      {
        name: Evoucher.name,
        schema: EvoucherSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: EvoucherCodeSequence.name,
        schema: EvoucherCodeSequenceSchema
      }
    ]),
  ],
  exports: [MongooseModule],
  controllers: [EvoucherCodeController],
  providers: [EvoucherCodeService],
})
export class EvoucherCodeModule { }
