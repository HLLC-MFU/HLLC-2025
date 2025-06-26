import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';
import {
  Kafka,
  Consumer,
  KafkaMessage,
  EachMessagePayload,
  ConsumerRunConfig,
  Logger,
} from 'kafkajs';
import { createMock } from '@golevelup/ts-jest';

jest.mock('kafkajs');

function createKafkaMessage(value: object): KafkaMessage {
  return {
    key: null,
    value: Buffer.from(JSON.stringify(value)),
    timestamp: Date.now().toString(),
    offset: '0',
    headers: {},
    attributes: 0,
  };
}

describe('KafkaService', () => {
  let service: KafkaService;
  let mockConsumer: jest.Mocked<Consumer>;

  // Mock logger object ให้ครบ interface Logger
  const mockLogger: Logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setLogLevel: jest.fn(),
    namespace: jest.fn(() => mockLogger),
  };

  beforeAll(() => {
    // Mock Kafka class ที่จะถูก new ใน service
    const KafkaMock = Kafka as jest.MockedClass<typeof Kafka>;
    KafkaMock.mockImplementation(() => ({
      consumer: () => mockConsumer,
      producer: jest.fn(),
      admin: jest.fn(),
      logger: () => mockLogger,
    }));
  });

  beforeEach(async () => {
    mockConsumer = createMock<Consumer>({
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      seek: jest.fn(),
      describeGroup: jest.fn(),
      on: jest.fn(),
      commitOffsets: jest.fn(),
      paused: jest.fn(),
      events: {
        CONNECT: 'consumer.connect',
        DISCONNECT: 'consumer.disconnect',
      },
      logger: undefined,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [KafkaService],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
  });

  describe('registerHandler', () => {
    it('should register handler before start', () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler('test-topic', handler);
      expect((service as any).handlers.get('test-topic')).toBe(handler);
    });

    it('should throw if registering after start', () => {
      (service as any).hasStarted = true;
      expect(() => {
        service.registerHandler('late-topic', async () => {});
      }).toThrowError(new Error('Cannot register after Kafka consumer started'));
    });
  });

  describe('start', () => {
    it('should subscribe and run handlers on start', async () => {
      const payloadReceived: object[] = [];
      const handler = jest.fn(async (payload: object) => {
        payloadReceived.push(payload);
      });

      service.registerHandler('my-topic', handler);

      let eachMessageHandler: ((payload: EachMessagePayload) => Promise<void>) | undefined;

      mockConsumer.run.mockImplementationOnce(async (config: ConsumerRunConfig) => {
        eachMessageHandler = config.eachMessage!;
      });

      await service.start();

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({ topic: 'my-topic' });
      expect(mockConsumer.run).toHaveBeenCalled();

      await eachMessageHandler?.({
        topic: 'my-topic',
        partition: 0,
        message: createKafkaMessage({ hello: 'world' }),
        heartbeat: jest.fn(),
        pause: jest.fn(),
      });

      expect(handler).toHaveBeenCalledWith({ hello: 'world' });
      expect(payloadReceived).toEqual([{ hello: 'world' }]);
    });

    it('should ignore topics without handlers', async () => {
      let eachMessageHandler: ((payload: EachMessagePayload) => Promise<void>) | undefined;

      mockConsumer.run.mockImplementationOnce(async (config: ConsumerRunConfig) => {
        eachMessageHandler = config.eachMessage!;
      });

      await service.start();

      const result = await eachMessageHandler?.({
        topic: 'unregistered-topic',
        partition: 0,
        message: createKafkaMessage({ ignored: true }),
        heartbeat: jest.fn(),
        pause: jest.fn(),
      });

      expect(result).toBeUndefined();
    });
  });

  describe('message handling', () => {
    it('should handle JSON parse errors gracefully', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const handler = jest.fn();

      service.registerHandler('bad-json-topic', handler);

      mockConsumer.run.mockImplementationOnce(async (config: ConsumerRunConfig) => {
        await config.eachMessage?.({
          topic: 'bad-json-topic',
          partition: 0,
          message: {
            value: Buffer.from('invalid-json'),
            key: null,
            timestamp: '0',
            offset: '0',
            headers: {},
            attributes: 0,
          },
          heartbeat: jest.fn(),
          pause: jest.fn(),
        });
      });

      await service.start();

      expect(handler).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Kafka] Error processing message from topic'),
        expect.any(SyntaxError),
      );

      errorSpy.mockRestore();
    });
  });
});
