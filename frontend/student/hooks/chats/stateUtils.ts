import { useCallback, useRef, Dispatch, SetStateAction } from 'react';

export interface ConnectionState {
  isConnecting: boolean;
  hasAttemptedConnection: boolean;
  reconnectAttempts: number;
}

export interface WebSocketState {
  ws: any;
  isConnected: boolean;
  error: string | null;
  messages: any[];
  connectedUsers: any[];
  typing: { id: string; name?: string }[];
}

export function useStateUtils(setState: Dispatch<SetStateAction<WebSocketState>>, connectionState: React.MutableRefObject<ConnectionState>) {
  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, [setState]);

  const updateConnectionState = useCallback((updates: Partial<ConnectionState>) => {
    connectionState.current = { ...connectionState.current, ...updates };
  }, [connectionState]);

  return { updateState, updateConnectionState };
} 