import { Injectable } from '@nestjs/common';
import { Expo, ExpoPushTicket } from 'expo-server-sdk';
import { KafkaService } from '../kafka/kafka.service';
import { PushNotificationDto } from './dto/push-notification.dto';

@Injectable()
export class PushNotificationService {
  constructor(private readonly kafka: KafkaService) {}

  private expo = new Expo();

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
    const messages = dto.to
      .filter((token) => Expo.isExpoPushToken(token))
      .map((token) => ({
        to: token,
        title: dto.title,
        body: dto.body,
      }));

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    return { tickets };
  }
}
