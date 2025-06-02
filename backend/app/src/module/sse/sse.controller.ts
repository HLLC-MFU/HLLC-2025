import { Controller, Sse } from '@nestjs/common';
import { SseService } from './sse.service';
import { map, Observable } from 'rxjs';
import { SsePayload } from 'src/pkg/types/sse.type';

/**
 * SseController
 * - Exposes an SSE endpoint for clients to subscribe to.
 * - This endpoint can send events from any module via SseService.
 */
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * SSE endpoint that clients connect to.
   * Streams events pushed by other modules.
   */
  @Sse()
  sse(): Observable<{ data: string }> {
    return this.sseService.eventStream.pipe(
      map((payload: SsePayload) => ({
        data: JSON.stringify(payload),
      })),
    );
  }
}