import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { KafkaModule } from './kafka.module';
import { KafkaService } from './kafka.service';
import { PushNotificationService } from '../notifications/push-notifications.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [KafkaModule, NotificationsModule, ConfigModule],
})
export class KafkaBootstrapModule implements OnModuleInit {
  constructor(
    private readonly kafka: KafkaService,
    private readonly pushNotification: PushNotificationService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.pushNotification.registerKafka();

    const isProduction = this.configService.get<boolean>('isProduction');
    
    if (isProduction) {
      await this.kafka.start();
    } else {
      Logger.verbose('[Kafka] Skipped starting kafka consumer (non-production)');
    }
  }
}
