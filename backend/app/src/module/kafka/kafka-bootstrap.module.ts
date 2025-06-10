import { Module, OnModuleInit } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { NotificationsService } from "../notifications/notifications.service";
import { KafkaModule } from "./kafka.module";
import { KafkaService } from "./kafka.service";

@Module({
  imports: [KafkaModule, NotificationsModule],
})
export class KafkaBootstrapModule implements OnModuleInit
 {
  constructor(
    private readonly kafka: KafkaService,
    private readonly noti: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.noti.registerKafka();
    await this.kafka.start();
  }
}