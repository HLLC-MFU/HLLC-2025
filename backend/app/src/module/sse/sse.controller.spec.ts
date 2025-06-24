import { Test, TestingModule } from '@nestjs/testing';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { of } from 'rxjs';
import { SsePayload } from 'src/pkg/types/sse.type';

describe('SseController', () => {
  let controller: SseController;

  const mockPayload: SsePayload = {
    type: 'REFETCH_USERS',
    event: 'user_update',
    data: { userId: '123' },
  };

  const mockSseService = {
    eventStream: of(mockPayload),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [
        {
          provide: SseService,
          useValue: mockSseService,
        },
      ],
    }).compile();

    controller = module.get<SseController>(SseController);
  });

  it('should stream SSE data correctly', (done) => {
    const observable$ = controller.sse();
    observable$.subscribe((value) => {
      expect(typeof value.data).toBe('string');
      const parsed = JSON.parse(value.data);
      expect(parsed.type).toBe('REFETCH_USERS');
      expect(parsed.data.userId).toBe('123');
      done();
    });
  });
});
