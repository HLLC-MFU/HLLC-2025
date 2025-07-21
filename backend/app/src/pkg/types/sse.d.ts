/**
 * Generic shape of SSE payload.
 * Use `type` as string identifier and optionally attach any data.
 */
export interface SsePayload {
  type: string;
  data?: Record<string, any>;
  path?: string; // Optional path to identify the source of the event
}
