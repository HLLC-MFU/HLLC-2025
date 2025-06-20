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
        {
          provide: 'FIREBASE_ADMIN',
          useValue: {
            messaging: () => ({
              sendEachForMulticast: jest.fn().mockResolvedValue({
                successCount: 1,
                failureCount: 0,
                responses: [{ status: 'ok' }],
              }),
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PushNotificationService) as PushNotificationServiceTestWrapper;
    kafkaService = module.get(KafkaService);
  });

  describe('sendPushNotification()', () => {
    it('should send push notifications and return valid response', async () => {
      const dto: PushNotificationDto = {
        to: ['ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'],
        title: 'Test Title',
        body: 'Test Body',
      };

      const result = await service.sendPushNotification(dto);

      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('failureCount');
      expect(result).toHaveProperty('responses');

      expect(typeof result.successCount).toBe('number');
      expect(typeof result.failureCount).toBe('number');
      expect(Array.isArray(result.responses)).toBe(true);
      expect(result.responses[0]).toEqual({ status: 'ok' });
    });
  });

  describe('registerKafka()', () => {
    it('should register kafka handler for chat-notifications', async () => {
      const spy = jest.spyOn(kafkaService, 'registerHandler');
      await service.registerKafka();

      const calls = spy.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toBe('chat-notifications');
      expect(calls[0][1]).toBeInstanceOf(Function);
    });
  });

  describe('handleChatNotification()', () => {
    it('should log notification payload to console', () => {
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
});
