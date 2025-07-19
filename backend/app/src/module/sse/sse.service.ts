import { Injectable } from '@nestjs/common';
import { ServerResponse } from 'http';
import { SsePayload } from 'src/pkg/types/sse';

/**
 * SseService
 * - Manages the push of SSE events to connected clients
 * - Other modules can call `notify()` to emit events
 */
@Injectable()
export class SseService {
  private readonly connections = new Map<string, ServerResponse>();

  /**
   * Register new SSE connection for a user.
   */
  register(userId: string, res: ServerResponse): void {
    this.connections.set(userId.toString(), res);
  }

  /**
   * Remove user connection when disconnected.
   */
  unregister(userId: string): void {
    this.connections.delete(userId.toString());
  }

  /**
   * Send event to a specific user by userId.
   */
  sendToUser(userId: string, payload: SsePayload): void {
    const res = this.connections.get(userId);
    if (!res) return;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    console.log(`Sent SSE to user ${userId}:`, payload);
  }

  /**
   * Broadcast event to all connected users.
   */
  broadcast(payload: SsePayload): void {
    for (const res of this.connections.values()) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    }
  }
}
