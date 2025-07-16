import { useEffect, useRef, useState } from 'react';

type SsePayload<T = any> = {
  type: string;
  path?: string;
  data: T;
};

export function useSSE<T = any>(
  onMessage?: (payload: SsePayload<T>) => void,
  onError?: (err: Event) => void,
) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse`;

    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = event => {
      try {
        const payload: SsePayload<T> = JSON.parse(event.data);

        console.log('[SSE] Message:', payload);
        if (onMessage) onMessage(payload);
      } catch (err) {
        console.error('[SSE] Failed to parse message', err);
      }
    };

    eventSource.onerror = err => {
      setConnected(false);
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [onError, onMessage]);

  return { connected };
}
