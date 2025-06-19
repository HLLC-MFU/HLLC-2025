import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { KafkaService } from "../kafka/kafka.service";
import { PushNotificationDto } from "./dto/push-notification.dto";
import type * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationService {
	constructor(
		private readonly kafka: KafkaService,
		@Inject('FIREBASE_ADMIN') 
		private readonly firebaseApp: admin.app.App,
	){}

  async registerKafka() {
    await this.kafka.registerHandler(
      'chat-notifications',
      this.handleChatNotification.bind(this),
    );
  }

  private async handleChatNotification(payload: ChatNotificationPayload) {
    console.log('[Notification]', payload);
    // TODO: implement out-app notification
  }

	async sendPushNotification(dto: PushNotificationDto) {
		const tokens = dto.to.filter(Boolean);
    if (!tokens.length) throw new BadRequestException("Tokens are missing");

    const messaging = this.firebaseApp.messaging();

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: dto.title,
        body: dto.body,
      },
      android: {
        priority: dto.priority ?? 'high',
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: dto.title,
              body: dto.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      // data: dto.data ? flattenData(dto.data) : undefined,
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
	}
}
