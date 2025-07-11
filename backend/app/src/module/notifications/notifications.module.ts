import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import {
  NotificationRead,
  NotificationReadSchema,
} from './schemas/notification-reads.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SseModule } from '../sse/sse.module';
import { KafkaModule } from '../kafka/kafka.module';
import { PushNotificationService } from './push-notifications.service';
import { UsersModule } from '../users/users.module';
import { DevicesModule } from '../devices/devices.module';
import { Device, DeviceSchema } from '../devices/schemas/device.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationRead.name, schema: NotificationReadSchema },
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Major.name, schema: MajorSchema },
    ]),
    SseModule,
    KafkaModule,
    UsersModule,
    DevicesModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationService],
  exports: [NotificationsService, PushNotificationService],
})
export class NotificationsModule {}
