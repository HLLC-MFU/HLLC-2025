import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
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
