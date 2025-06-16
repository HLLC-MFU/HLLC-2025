import { Module } from '@nestjs/common';
import { CoinCollectionsService } from './coin-collections.service';
import { CoinCollectionsController } from './coin-collections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinCollection, CoinCollectionSchema } from './schema/coin-collection.schema';
import { Landmark, LandmarkSchema } from '../landmarks/schema/landmark.schema';

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
