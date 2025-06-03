import { Module } from '@nestjs/common';
import { EvoucherCodeService } from './evoucher-code.service';
import { EvoucherCodeController } from './evoucher-code.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EvoucherCode, EvoucherCodeSchema } from './schema/evoucher-code.schema';
import { EvoucherModule } from '../evoucher/evoucher.module';
import { User } from '../users/schemas/user.schema';
import { UserSchema } from '../users/schemas/user.schema';
import { Evoucher, EvoucherSchema } from '../evoucher/schema/evoucher.schema';

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
      }
    ]),
  ],
  exports: [MongooseModule],
  controllers: [EvoucherCodeController],
  providers: [EvoucherCodeService],
})
export class EvoucherCodeModule {}
