import { Module } from '@nestjs/common';
import { SystemStatusService } from './system-status.service';
import { SystemStatusController } from './system-status.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SystemStatus,
  SystemStatusSchema,
} from './schemas/system-status.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SystemStatusGuard } from './guards/system-status.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemStatus.name, schema: SystemStatusSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SystemStatusController],
  providers: [SystemStatusService, SystemStatusGuard],
  exports: [MongooseModule, SystemStatusGuard],
})
export class SystemStatusModule {}
