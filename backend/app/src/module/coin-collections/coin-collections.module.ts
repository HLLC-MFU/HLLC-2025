import { forwardRef, Module } from '@nestjs/common';
import { CoinCollectionsService } from './service/coin-collections.service';
import { CoinCollectionsController } from './controller/coin-collections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinCollection, CoinCollectionSchema } from './schema/coin-collection.schema';
import { Landmark, LandmarkSchema } from './schema/landmark.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CoinCollectionsHelper } from './utils/coin-collections.helper';
import { EvoucherCode, EvoucherCodeSchema } from '../evouchers/schemas/evoucher-code.schema';
import { Evoucher, EvoucherSchema } from '../evouchers/schemas/evoucher.schema';
import { EvouchersModule } from '../evouchers/evouchers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: CoinCollection.name,
      schema: CoinCollectionSchema
    },
    {
      name: Landmark.name,
      schema: LandmarkSchema
    },
    {
      name: User.name,
      schema: UserSchema
    },
    {
      name: Evoucher.name,
      schema: EvoucherSchema
    },
    {
      name: EvoucherCode.name,
      schema: EvoucherCodeSchema
    },
  ]), EvouchersModule ,NotificationsModule],
  controllers: [CoinCollectionsController],
  providers: [CoinCollectionsService, CoinCollectionsHelper],
  exports: [CoinCollectionsService],
})
export class CoinCollectionsModule { }
