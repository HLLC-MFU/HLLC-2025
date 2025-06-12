import { Injectable } from "@nestjs/common";
import { EachMessagePayload, Kafka } from "kafkajs";
import { KAFKA_CONFIG } from './kafka.constant';

@Injectable()
export class KafkaService {
	private hasStarted = false;

	private readonly kafka = new Kafka({
		clientId: KAFKA_CONFIG.CLIENT_ID,
		brokers: KAFKA_CONFIG.BROKERS,
	});

	private readonly consumer = this.kafka.consumer({ groupId: KAFKA_CONFIG.GROUP_ID });

	private readonly handlers = new Map<string, (payload: any) => Promise<void>>();

	async registerHandler(topic: string, handler: (payload: any) => Promise<void>) {
		if (this.hasStarted) throw new Error('Cannot register after Kafka consumer started');
    this.handlers.set(topic, handler);
  }

  async start() {
    await this.consumer.connect();

    for (const topic of this.handlers.keys()) {
      await this.consumer.subscribe({ topic });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        const handler = this.handlers.get(topic);
        if (!handler) return;

				try {
					const payload = JSON.parse(message.value?.toString() ?? '{}');
					await handler(payload);
				} catch (err) {
					console.error(`[Kafka] Error processing message from topic ${topic}:`, err);
				}
      },
    });

    this.hasStarted = true;
  }

}