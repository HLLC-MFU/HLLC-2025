import { SseService } from './sse.service';
import { SsePayload } from 'src/pkg/types/sse.type';
import { SseEventType } from 'src/pkg/types/sse.type'; 
import { take } from 'rxjs/operators';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    service = new SseService();
  });

  it('should emit events via notify()', (done) => {
    const mockPayload: SsePayload = {
      type: 'REFETCH_NOTIFICATIONS', 
      event: 'test',
      data: { msg: 'hello' },
    };

    service.eventStream.pipe(take(1)).subscribe((received) => {
      expect(received).toEqual(mockPayload);
      done();
    });

    service.notify(mockPayload);
  });

  it('eventStream should be an observable', () => {
    expect(typeof service.eventStream.subscribe).toBe('function');
  });
});
