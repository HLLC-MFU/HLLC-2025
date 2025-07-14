import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { EachMessagePayload, Kafka } from 'kafkajs';
import { KAFKA_CONFIG } from './kafka.constant';
import { ChatNotificationPayload } from 'src/pkg/types/kafka';

type KafkaTopicPayloadMap = {
  'chat-notifications': ChatNotificationPayload;
};

@Injectable()
export class KafkaService<Topics extends Record<string, any> = KafkaTopicPayloadMap> 
  implements OnApplicationShutdown 
{
  private hasStarted = false;

  private readonly kafka = new Kafka({
    clientId: KAFKA_CONFIG.CLIENT_ID,
    brokers: KAFKA_CONFIG.BROKERS,
  });

  private readonly consumer = this.kafka.consumer({
    groupId: KAFKA_CONFIG.GROUP_ID,
    sessionTimeout: 10000,
    heartbeatInterval: 3000,
  });

  private readonly handlers = new Map<
    keyof Topics,
    (payload: Topics[keyof Topics]) => Promise<void>
  >();

  registerHandler<Key extends keyof Topics>(
    topic: Key,
    handler: (payload: Topics[Key]) => Promise<void>,
  ) {
    if (this.hasStarted)
      throw new Error('Cannot register after Kafka consumer started');
    this.handlers.set(topic, handler as (payload: Topics[keyof Topics]) => Promise<void>);
  }

  async start() {
    await this.consumer.connect();

    for (const topic of this.handlers.keys()) {
      await this.consumer.subscribe({ topic: topic as string, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        const handler = this.handlers.get(topic as keyof Topics);
        if (!handler) return;

        try {
          const payload: Topics[keyof Topics] = JSON.parse(
            message.value?.toString() ?? '{}',
          );

          await handler(payload);
        } catch (err) {
          Logger.error(
            `[Kafka] Error processing message from topic ${topic}:`,
            err,
          );
        }
      },
    });

    this.hasStarted = true;
  }

  async onApplicationShutdown() {
    if (this.hasStarted) {
      await this.consumer.disconnect();
      Logger.verbose('[Kafka] Consumer disconnected gracefully');
    }
  }
}
