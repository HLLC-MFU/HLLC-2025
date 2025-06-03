import { Module } from '@nestjs/common';
import { SponsorsService } from './sponsors.service';
import { SponsorsController } from './sponsors.controller';
import { SponsorsSchema } from './schema/sponsors.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Sponsors } from './schema/sponsors.schema';
import { SponsorsType } from '../sponsors-type/schema/sponsors-type.schema';
import { SponsorsTypeSchema } from '../sponsors-type/schema/sponsors-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Sponsors.name,
        schema: SponsorsSchema
      },
      {
        name: SponsorsType.name,
        schema: SponsorsTypeSchema
      }
    ])
  ],
  exports: [MongooseModule],
  controllers: [SponsorsController],
  providers: [SponsorsService],
})
export class SponsorsModule {}
