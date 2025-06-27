import { Module } from '@nestjs/common';
import { SponsorsController } from './controllers/sponsors.controller';
import { SponsorsService } from './services/sponsors.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Sponsors, SponsorsSchema } from './schemas/sponsors.schema';
import {
  SponsorsType,
  SponsorsTypeSchema,
} from './schemas/sponsors-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Sponsors.name,
        schema: SponsorsSchema,
      },
      {
        name: SponsorsType.name,
        schema: SponsorsTypeSchema,
      },
    ]),
  ],
  controllers: [SponsorsController],
  providers: [SponsorsService],
  exports: [SponsorsService],
})
export class SponsorsModule {}
