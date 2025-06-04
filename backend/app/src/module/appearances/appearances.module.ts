import { Module } from '@nestjs/common';
import { AppearancesService } from './appearances.service';
import { AppearancesController } from './appearances.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Appearance, ApprearanceSchema } from './schemas/apprearance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appearance.name, schema: ApprearanceSchema },
    ]),
  ],
  controllers: [AppearancesController],
  providers: [AppearancesService],
  exports: [MongooseModule],
})
export class AppearancesModule {}
