import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationService } from './push-notifications.service';
import { KafkaService } from '../kafka/kafka.service';
import { PushNotificationDto } from './dto/push-notification.dto';

// Mock Expo SDK
jest.mock('expo-server-sdk', () => {
  return {
    Expo: class {
      static isExpoPushToken(token: string) {
        return true;
      }

      chunkPushNotifications = jest.fn().mockImplementation((msgs) => [msgs]);
      sendPushNotificationsAsync = jest.fn().mockResolvedValue([
        { status: 'ok' },
      ]);
    },
  };
});

// Define the type for the Kafka payload
type ChatNotificationPayload = {
  userId: string;
  message: string;
  type: string;
};

// Intermediate class to access private method for testing
class PushNotificationServiceTestWrapper extends PushNotificationService {
  public callHandleChatNotification(payload: ChatNotificationPayload): void {
    // @ts-expect-error: Accessing private method for testing
    this.handleChatNotification(payload);
  }
}

describe('PushNotificationService', () => {
  let service: PushNotificationServiceTestWrapper;
  let kafkaService: KafkaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PushNotificationService,
          useClass: PushNotificationServiceTestWrapper,
        },
        {
          provide: KafkaService,
          useValue: {
            registerHandler: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PushNotificationService) as PushNotificationServiceTestWrapper;
    kafkaService = module.get(KafkaService);
  });

  it('should send push notifications', async () => {
    const dto: PushNotificationDto = {
      to: ['ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'],
      title: 'Test Title',
      body: 'Test Body',
    };

    const result = await service.sendPushNotification(dto);

    expect(result).toHaveProperty('tickets');
    expect(Array.isArray(result.tickets)).toBe(true);
    expect(result.tickets[0]).toEqual({ status: 'ok' });
  });

  it('should register kafka handler', async () => {
  const spy = jest.spyOn(kafkaService, 'registerHandler');
  await service.registerKafka();

  const calls = spy.mock.calls;
  expect(calls.length).toBe(1);
  expect(calls[0][0]).toBe('chat-notifications');
  expect(calls[0][1]).toBeInstanceOf(Function);
});


  it('should handle chat notification (log only)', () => {
    const payload: ChatNotificationPayload = {
      userId: 'user123',
      message: 'Hello',
      type: 'chat',
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    service.callHandleChatNotification(payload);

    expect(consoleSpy).toHaveBeenCalledWith('[Notification]', payload);
    consoleSpy.mockRestore();
  });
});
