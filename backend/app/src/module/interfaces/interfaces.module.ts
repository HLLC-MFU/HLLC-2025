import { Module } from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Interfaces, InterfacesSchema } from './schema/interfaces.schema';
import { InterfaceController } from './interfaces.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interfaces.name, schema: InterfacesSchema },
    ]),
  ],
  controllers: [InterfaceController],
  providers: [InterfacesService],
  exports: [MongooseModule, InterfacesService],
})
export class InterfacesModule {}
