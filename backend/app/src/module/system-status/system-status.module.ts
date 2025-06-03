import { Module } from '@nestjs/common';
import { SystemStatusService } from './system-status.service';
import { SystemStatusController } from './system-status.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SystemStatus,
  SystemStatusSchema,
} from './schemas/system-status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemStatus.name, schema: SystemStatusSchema },
    ]),
  ],
  controllers: [SystemStatusController],
  providers: [SystemStatusService],
  exports: [MongooseModule],
})
export class SystemStatusModule {}
