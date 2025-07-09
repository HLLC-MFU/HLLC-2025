import { useEffect, useRef, useState, useCallback } from 'react';
import useProfile from '@/hooks/useProfile';
import { Message, ConnectedUser } from '../../types/chatTypes';
import { getToken } from '@/utils/storage';
import { WS_BASE_URL } from '../../configs/chats/chatConfig';
import { Buffer } from 'buffer';
import { createMessage, safeUser } from './messageUtils';
import { useStateUtils, ConnectionState, WebSocketState } from './stateUtils';
import { onMessage as baseOnMessage, onOpen, onClose, attemptReconnect } from './websocketHandlers';

const MAX_MESSAGES = 100;
const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECTION_TIMEOUT = 5000;
const PING_INTERVAL = 60000;
const RECONNECT_DELAY = 3000;

export interface WebSocketHook {
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
  sendTyping: () => void;
  sendReadReceipt: (messageId: string) => void;
  sendReaction: (messageId: string, reaction: string) => void;
  messages: Message[];
  connectedUsers: ConnectedUser[];
  typing: { id: string; name?: string }[];
  connect: (roomId: string) => Promise<void>;
  disconnect: () => void;
  ws: WebSocket | null;
  addMessage: (message: Message) => void;
}

// Patch onMessage to handle unsend event and remove message from state
function onMessage(event: MessageEvent, args: any) {
  const { state, addMessage, userId, setState } = args;
  try {
    const data = JSON.parse(event.data);
    // Handle unsend event (eventType: 'unsend' or type: 'unsend' or 'unsend_message')
    if (
      data.eventType === 'unsend' ||
      data.type === 'unsend' ||
      data.eventType === 'unsend_message' ||
      data.type === 'unsend_message'
    ) {
      const messageId = data.payload?.messageId || data.payload?.id || data.messageId || data.id;
      if (messageId) {
        setState((prev: any) => {
          const filtered = prev.messages.filter((m: any) => m.id !== messageId);
          return { ...prev, messages: filtered };
        });
      }
      return;
    }
    // Fallback to base handler
    baseOnMessage(event, args);
  } catch (err) {
    console.error('Error handling message:', err, event.data);
  }
}

export const useWebSocket = (roomId: string): WebSocketHook => {
  const { user } = useProfile();
  const userId = user?.data[0]?._id;

  const [state, setState] = useState<WebSocketState>({
    ws: null,
    isConnected: false,
    error: null,
    messages: [],
    connectedUsers: [],
    typing: []
  });

  const connectionState = useRef<ConnectionState>({
    isConnecting: false,
    hasAttemptedConnection: false,
    reconnectAttempts: 0
  });

  const sentMessageIds = useRef<Set<string>>(new Set());
  const connectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { updateState, updateConnectionState } = useStateUtils(setState, connectionState);

  // Add message with deduplication
  const addMessage = useCallback((message: Message | null) => {
    if (!message || !message.id) return;
    setState(prev => {
      const messageId = message.id || '';
      if (!messageId) return prev;

      let filteredMessages = prev.messages;
      // ถ้าเป็นข้อความจริง (isTemp = false) ให้ลบ temp message ที่ตรงกันออกก่อน
      if (!message.isTemp && message.text) {
        filteredMessages = prev.messages.filter(
          m => !(
            m.isTemp &&
            m.text === message.text &&
            m.user?._id === message.user?._id
          )
        );
        if (prev.messages.length !== filteredMessages.length) {
        }
      }

      if (filteredMessages.some(msg => msg.id === messageId) || sentMessageIds.current.has(messageId)) {
        return { ...prev, messages: filteredMessages };
      }
      sentMessageIds.current.add(messageId);
      const newMessages = [...filteredMessages, message];
      return { ...prev, messages: newMessages.slice(-MAX_MESSAGES) };
    });
  }, []);

  // WebSocket connect logic
  const connect = useCallback(async (roomIdParam?: string) => {
    const rid = roomIdParam || '';
    if (!rid || !userId || connectionState.current.isConnecting || (state.ws && state.ws.readyState === WebSocket.OPEN)) return;
    try {
      updateConnectionState({ isConnecting: true });
      const token = await getToken('accessToken');
      if (!token) throw new Error('No access token found');
      // Check token expiration
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
      if (Date.now() >= payload.exp * 1000) throw new Error('Token expired');
      const wsUrl = `${WS_BASE_URL}/chat/ws/${rid}?token=${token}`;
      if (state.ws) {
        try { state.ws.close(); } catch {}
        updateState({ ws: null });
      }
      const socket: any = new WebSocket(wsUrl);
      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      connectionTimeout.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          updateConnectionState({ isConnecting: false });
          updateState({ error: 'Connection timeout' });
        }
      }, CONNECTION_TIMEOUT);
      socket.onmessage = (event: MessageEvent) => onMessage(event, { state, addMessage, userId, setState });
      socket.onopen = (event: Event) => onOpen(event, { ws: socket, updateState, updateConnectionState, connectionTimeout, PING_INTERVAL });
      socket.onclose = (event: CloseEvent) => onClose(event, { updateState, updateConnectionState, connectionTimeout, ws: socket, attemptReconnect: () => attemptReconnect({ connectionState, reconnectTimeoutRef, state, connect, roomId: rid, MAX_RECONNECT_ATTEMPTS }) });
      updateState({ ws: socket });
    } catch (error) {
      updateState({ error: 'Failed to create WebSocket connection' });
      updateConnectionState({ isConnecting: false });
      setTimeout(() => {
        attemptReconnect({ connectionState, reconnectTimeoutRef, state, connect, roomId: rid, MAX_RECONNECT_ATTEMPTS });
      }, RECONNECT_DELAY);
    }
  }, [userId, state.ws, addMessage, updateState, updateConnectionState]);

  // Disconnect logic
  const disconnect = useCallback(() => {
    if (state.ws) {
      state.ws.close();
      updateState({ ws: null });
    }
    updateConnectionState({ hasAttemptedConnection: false });
  }, [state.ws, updateState, updateConnectionState]);

  // Message sending functions
  const sendMessage = useCallback((message: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      updateState({ error: 'Not connected to chat server' });
      return;
    }
    try {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sentMessageIds.current.add(messageId);
      state.ws.send(message);
    } catch (error) {
      updateState({ error: 'Failed to send message' });
    }
  }, [state.ws, updateState]);

  const sendTyping = useCallback(() => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({ eventType: 'typing', payload: { typing: true } }));
  }, [state.ws]);

  const sendReadReceipt = useCallback((messageId: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({ eventType: 'read_receipt', payload: { messageId } }));
  }, [state.ws]);

  const sendReaction = useCallback((messageId: string, reaction: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({ eventType: 'message_reaction', payload: { messageId, reaction } }));
  }, [state.ws]);

  // Auto connect/disconnect on mount/unmount
  useEffect(() => {
    if (roomId && userId && !connectionState.current.isConnecting && !state.ws && !state.isConnected && !connectionState.current.hasAttemptedConnection) {
      updateConnectionState({ hasAttemptedConnection: true });
      connect(roomId);
    }
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      if (state.ws) {
        const socket = state.ws;
        if (socket.heartbeatInterval) clearInterval(socket.heartbeatInterval);
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          try { socket.close(1000, 'Component unmounted'); } catch {}
        }
      }
      updateState({ connectedUsers: [], isConnected: false, error: null });
      updateConnectionState({ isConnecting: false, hasAttemptedConnection: false });
    };
  }, [roomId, userId]);

  // Clear messages when room or user changes
  useEffect(() => {
    updateState({ messages: [], connectedUsers: [], typing: [] });
    sentMessageIds.current.clear();
  }, [roomId, userId]);

  return {
    isConnected: state.isConnected,
    error: state.error,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendReaction,
    messages: state.messages,
    connectedUsers: state.connectedUsers,
    typing: state.typing,
    connect,
    disconnect,
    ws: state.ws,
    addMessage,
  };
};

export default useWebSocket; 