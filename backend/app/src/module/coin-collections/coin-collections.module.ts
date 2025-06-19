import { Module } from '@nestjs/common';
import { CoinCollectionsService } from './service/coin-collections.service';
import { CoinCollectionsController } from './controller/coin-collections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinCollection, CoinCollectionSchema } from './schema/coin-collection.schema';
import { Landmark, LandmarkSchema } from './schema/landmark.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: CoinCollection.name,
      schema: CoinCollectionSchema
    },
    {
      name: Landmark.name,
      schema: LandmarkSchema
    }
  ])],
  controllers: [CoinCollectionsController],
  providers: [CoinCollectionsService],
  exports: [CoinCollectionsService],
})
export class CoinCollectionsModule { }
