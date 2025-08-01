import { Controller, Get, Req, Res } from '@nestjs/common';
import { SseService } from './sse.service';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { UserRequest } from 'src/pkg/types/users';

/**
 * SseController
 * - This endpoint can send events from any module via SseService.
 */
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * SSE connection endpoint — one per user.
   */
  @Get()
  sse(@Req() req: UserRequest, @Res() reply: FastifyReply) {
    const res = reply.raw as ServerResponse;

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    }

    const origin = req.headers.origin;
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    res.writeHead(200, headers)

    this.sseService.register(req.user._id, res);

    const keepAlive = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': keep-alive\n\n');
      }
    }, 25_000);

    req.raw.on('close', () => {
      clearInterval(keepAlive);
      this.sseService.unregister(req.user._id);
    });
  }
}
