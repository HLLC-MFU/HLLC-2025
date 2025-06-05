import { Module } from '@nestjs/common';
import { AppearancesService } from './appearances.service';
import { AppearancesController } from './appearances.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Appearance } from './schemas/apprearance.schema';
import { AppearanceSchema } from './schemas/apprearance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appearance.name, schema: AppearanceSchema },
    ]),
  ],
  controllers: [AppearancesController],
  providers: [AppearancesService],
  exports: [MongooseModule, AppearancesService],
})
export class AppearancesModule {}
