import { Module } from '@nestjs/common';
import { SponsorsTypeService } from './sponsors-type.service';
import { SponsorsTypeController } from './sponsors-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SponsorsTypeSchema } from './schema/sponsors-type.schema';
import { SponsorsType } from './schema/sponsors-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SponsorsType.name,
        schema: SponsorsTypeSchema,
      }
    ])
  ],
  exports: [MongooseModule],
  controllers: [SponsorsTypeController],
  providers: [SponsorsTypeService],
})
export class SponsorsTypeModule {}
