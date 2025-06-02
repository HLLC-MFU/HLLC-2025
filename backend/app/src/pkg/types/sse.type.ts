/**
 * SsePayload
 * - Generic shape of SSE payload
 * - Any module can use this type for their own events
 */
export type SsePayload = {
  type: SseEventType;
} & Record<string, any>;

/**
 * Represents the possible types of Server-Sent Events (SSE) that can be emitted by the backend.
 * 
 * - `'REFETCH_NOTIFICATIONS'`: Indicates that notifications should be refetched.
 * - `'REFETCH_ACTIVITIES'`: Indicates that activities should be refetched.
 * - `'REFETCH_USERS'`: Indicates that user data should be refetched.
 */
export type SseEventType = 'REFETCH_NOTIFICATIONS' | 'REFETCH_ACTIVITIES' | 'REFETCH_USERS';