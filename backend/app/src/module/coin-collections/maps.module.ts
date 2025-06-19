import { Module } from '@nestjs/common';
import { MapsService } from './service/maps.service';
import { MapsController } from './controller/maps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MapSchema } from './schema/map.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: Map.name,
      schema: MapSchema,
    }
  ])],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService]
})
export class MapsModule { }
