import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { SsePayload } from 'src/pkg/types/sse.type';

/**
 * SseService
 * - Manages the push of SSE events to connected clients
 * - Other modules can call `notify()` to emit events
 */
@Injectable()
export class SseService {
  private readonly _eventSubject = new Subject<SsePayload>();

  /**
   * Observable stream that clients subscribe to for SSE events.
   */
  get eventStream() {
    return this._eventSubject.asObservable();
  }

  /**
   * Emit a new SSE event to connected clients.
   * @param payload The data to send to clients
   */
  notify(payload: SsePayload): void {
    this._eventSubject.next(payload);
  }
}
