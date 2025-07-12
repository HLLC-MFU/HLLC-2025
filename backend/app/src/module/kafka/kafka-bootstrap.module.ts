import { Module, OnModuleInit } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { KafkaModule } from './kafka.module';
import { KafkaService } from './kafka.service';
import { PushNotificationService } from '../notifications/push-notifications.service';

@Module({
  imports: [KafkaModule, NotificationsModule],
})
export class KafkaBootstrapModule implements OnModuleInit {
  constructor(
    private readonly kafka: KafkaService,
    private readonly pushNotification: PushNotificationService,
  ) {}

  async onModuleInit() {
    await this.pushNotification.registerKafka();
    
    await this.kafka.start();
  }
}
