import { useEffect, useRef, useState, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Message, ConnectedUser } from '../../types/chat';
import { getToken } from '@/utils/storage';
import { getWebSocketUrl } from '../../configs/chats/chatConfig';
import { Buffer } from 'buffer';
import { useStateUtils, ConnectionState, WebSocketState } from './stateUtils';
import { onMessage as baseOnMessage, onOpen, onClose, attemptReconnect } from './websocketHandlers';

const MAX_MESSAGES = 100;
const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECTION_TIMEOUT = 10000; // Increased timeout
const PING_INTERVAL = 60000;
const RECONNECT_DELAY = 3000;

export interface WebSocketHook {
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<boolean>;
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

function debugLog(...args: any[]) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[WebSocketHook]', ...args);
  }
}

function errorLog(...args: any[]) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('[WebSocketHook]', ...args);
  }
}

function warnLog(...args: any[]) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('[WebSocketHook]', ...args);
  }
}

// Patch onMessage to handle unsend event and remove message from state
function onMessage(event: MessageEvent, args: any) {
  const { state, addMessage, userId, setState } = args;
  try {
    const data = JSON.parse(event.data);
    debugLog('[onMessage] Received:', data);
    // Handle unsend event
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
    // Handle all chat event types
    if (data.type && data.payload) {
      let msg;
      let user = data.payload.user || {};
      let extra: any = {};
      switch (data.type) {
        case 'message':
          msg = data.payload.message;
          break;
        case 'sticker':
          msg = data.payload.message;
          extra.sticker = data.payload.sticker;
          break;
        case 'reply':
          msg = data.payload.message;
          extra.replyTo = data.payload.replyTo;
          break;
        case 'mention':
          msg = data.payload.message;
          extra.mentions = data.payload.mentions;
          break;
        case 'upload':
          msg = data.payload.message;
          extra.filename = data.payload.filename;
          break;
        default:
          msg = data.payload.message;
      }
      if (msg) {
        const newMessage = require('@/hooks/chats/messageUtils').createMessage({
          ...msg,
          user,
          user_id: user._id,
          username: user.username,
          ...extra,
        }, true);
        debugLog(`[onMessage] Adding ${data.type} message:`, newMessage);
        if (newMessage) addMessage(newMessage);
      }
      return;
    }
    // Handle history event
    if (data.eventType === 'history') {
      const messageData = data.payload;
      if (Array.isArray(messageData)) {
        messageData.forEach((msg) => {
          if (!msg) return;
          const newMessage = require('@/hooks/chats/messageUtils').createMessage(msg, true);
          debugLog('[onMessage] Adding history message:', newMessage);
          if (newMessage) addMessage(newMessage);
        });
      } else if (messageData && messageData.id) {
        const newMessage = require('@/hooks/chats/messageUtils').createMessage(messageData, true);
        debugLog('[onMessage] Adding history message:', newMessage);
        if (newMessage) addMessage(newMessage);
      }
      return;
    }
    // Fallback to base handler for other types
    baseOnMessage(event, args);
    // --- FORCE SHOW ALL ---
    // If not handled, always try to show as message
    try {
      const fallbackMsg = require('@/hooks/chats/messageUtils').createMessage(data, true);
      debugLog('[onMessage] Fallback force-add:', fallbackMsg);
      if (fallbackMsg) addMessage(fallbackMsg);
    } catch (e) {
      debugLog('[onMessage] Fallback failed:', e);
    }
  } catch (err) {
    errorLog('Error handling message:', err, event.data);
  }
}

export const useWebSocket = (roomId: string): WebSocketHook => {
  const { user } = useProfile();
  const userId = user?._id;

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
    if (!message) return;
    
    // Generate a stable ID if missing
    if (!message.id) {
      message.id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    debugLog('[addMessage] called with:', message);
    
    setState(prev => {
      const messageId = message.id || '';
      if (!messageId) return prev;

      // Check for duplicates using a more reliable method
      const isDuplicate = prev.messages.some(msg => {
        // Check by ID first
        if (msg.id === messageId) return true;
        
        // For messages without ID, check content and timestamp
        if (!msg.id || !messageId) {
          return (
            msg.text === message.text &&
            msg.user?._id === message.user?._id &&
            msg.timestamp === message.timestamp
          );
        }
        return false;
      });

      if (isDuplicate) {
        debugLog('[addMessage] duplicate message detected:', messageId);
        return prev;
      }

      // If this is a real message, remove any temporary messages with the same content
      let filteredMessages = prev.messages;
      if (!message.isTemp && message.text) {
        filteredMessages = prev.messages.filter(
          m => !(m.isTemp && m.text === message.text && m.user?._id === message.user?._id)
        );
      }

      // Limit the number of messages to prevent memory issues
      const newMessages = [...filteredMessages, message].slice(-MAX_MESSAGES);
      debugLog('[addMessage] adding new message:', message);
      
      return { ...prev, messages: newMessages };
    });
  }, []);

  // WebSocket connect logic - Updated to use correct URL format
  const connect = useCallback(async (roomIdParam?: string) => {
    const rid = roomIdParam || roomId || '';
    debugLog('[WebSocket] Attempting to connect...', { 
      roomId: rid,
      isConnecting: connectionState.current.isConnecting,
      hasExistingConnection: !!(state.ws && state.ws.readyState === WebSocket.OPEN)
    });
    
    if (!rid) {
      errorLog('[WebSocket] No roomId provided, cannot connect');
      updateState({ error: 'No roomId provided' });
      return;
    }
    // Only require accessToken, not userId
    if (connectionState.current.isConnecting) {
      warnLog('Already connecting, skipping');
      return;
    }
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      warnLog('WebSocket already open, skipping');
      return;
    }
    try {
      updateConnectionState({ isConnecting: true });
      const token = await getToken('accessToken');
      if (!token) {
        errorLog('No access token found');
        updateState({ error: 'No access token found' });
        updateConnectionState({ isConnecting: false });
        return;
      }
      // Check token expiration
      let payload: any = null;
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
      } catch (e) {
        errorLog('Invalid token format', e);
        updateState({ error: 'Invalid access token format' });
        updateConnectionState({ isConnecting: false });
        return;
      }
      if (Date.now() >= payload.exp * 1000) {
        errorLog('Token expired');
        updateState({ error: 'Access token expired' });
        updateConnectionState({ isConnecting: false });
        return;
      }
      // Use the correct WebSocket URL format (roomId + token only)
      const wsUrl = getWebSocketUrl(rid, token);
      debugLog('Connecting to WebSocket URL:', wsUrl);
      if (state.ws) {
        try { state.ws.close(); } catch {}
        updateState({ ws: null });
      }
      const socket: any = new WebSocket(wsUrl);
      debugLog('WebSocket object created:', socket);
      // Enhanced connection timeout handling
      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      connectionTimeout.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          errorLog('WebSocket connection timeout, closing socket');
          socket.close();
          updateConnectionState({ isConnecting: false });
          updateState({ error: 'Connection timeout' });
        }
      }, CONNECTION_TIMEOUT);
      // Enhanced event handlers with better logging
      socket.onmessage = (event: MessageEvent) => {
        debugLog('WebSocket onmessage:', event);
        onMessage(event, { state, addMessage, userId, setState });
      };
      socket.onopen = (event: Event) => {
        debugLog('WebSocket onopen:', event);
        onOpen(event, { ws: socket, updateState, updateConnectionState, connectionTimeout, PING_INTERVAL });
      };
      socket.onclose = (event: CloseEvent) => {
        warnLog('WebSocket onclose:', event);
        onClose(event, {
          updateState,
          updateConnectionState,
          connectionTimeout,
          ws: socket,
          attemptReconnect: () => attemptReconnect({
            connectionState,
            reconnectTimeoutRef,
            state,
            connect,
            roomId: rid,
            MAX_RECONNECT_ATTEMPTS
          })
        });
      };
      socket.onerror = (error: Event) => {
        errorLog('WebSocket onerror:', error);
        updateState({ error: 'WebSocket connection error' });
      };
      updateState({ ws: socket });
    } catch (error) {
      errorLog('Failed to create WebSocket connection:', error);
      updateState({ error: 'Failed to create WebSocket connection' });
      updateConnectionState({ isConnecting: false });
      setTimeout(() => {
        attemptReconnect({ connectionState, reconnectTimeoutRef, state, connect, roomId: rid, MAX_RECONNECT_ATTEMPTS });
      }, RECONNECT_DELAY);
    }
  }, [state.ws, addMessage, updateState, updateConnectionState, roomId]);

  // Disconnect logic
  const disconnect = useCallback(() => {
    debugLog('Disconnect called');
    if (state.ws) {
      try { state.ws.close(); } catch {}
      updateState({ ws: null });
    }
    updateConnectionState({ hasAttemptedConnection: false });
  }, [state.ws, updateState, updateConnectionState]);

  // Helper to build the correct message format for the backend
  function buildChatMessagePayload(text: string) {
    return JSON.stringify({
      type: 'message',
      payload: { message: text }
    });
  }

  // Message sending functions
  const sendMessage = useCallback(async (message: string | object): Promise<boolean> => {
    debugLog('[WebSocket] sendMessage called', { message, readyState: state.ws?.readyState });
    
    // If not connected, try to reconnect first
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      errorLog('[WebSocket] Not connected to chat server, attempting to reconnect...');
      try {
        await connect(roomId);
        if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
          errorLog('[WebSocket] Reconnection failed - still not connected');
          updateState({ error: 'Failed to connect to chat server' });
          return false;
        }
        debugLog('[WebSocket] Successfully reconnected to chat server');
      } catch (error) {
        errorLog('[WebSocket] Reconnection failed with error:', error);
        updateState({ error: 'Failed to connect to chat server' });
        return false;
      }
    }
    
    try {
      let toSend: string;
      let messageType = 'unknown';
      
      if (typeof message === 'string') {
        // Wrap plain string in correct format
        toSend = buildChatMessagePayload(message);
        messageType = 'text';
      } else {
        // If already an object, send as JSON
        toSend = JSON.stringify(message);
        messageType = (message as any).type || 'object';
      }
      
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sentMessageIds.current.add(messageId);
      
      debugLog('[WebSocket] Broadcasting message:', {
        messageId,
        type: messageType,
        content: toSend.length > 100 ? toSend.substring(0, 100) + '...' : toSend,
        readyState: state.ws.readyState,
        url: state.ws.url
      });
      
      // Log the exact moment before sending
      console.log(`[WebSocket][${new Date().toISOString()}] Sending message (${messageId})...`);
      
      // Send the message
      state.ws.send(toSend);
      
      // Log after sending
      console.log(`[WebSocket][${new Date().toISOString()}] Message sent (${messageId})`);
      debugLog('[WebSocket] Message sent successfully', { messageId });
      
      return true;
      
    } catch (error) {
      errorLog('[WebSocket] Failed to send message', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      updateState({ error: 'Failed to send message' });
      return false;
    }
  }, [state.ws, updateState]);

  const sendTyping = useCallback(() => {
    debugLog('sendTyping called');
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({ eventType: 'typing', payload: { typing: true } }));
  }, [state.ws]);

  const sendReadReceipt = useCallback((messageId: string) => {
    debugLog('sendReadReceipt called', messageId);
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({ eventType: 'read_receipt', payload: { messageId } }));
  }, [state.ws]);

  const sendReaction = useCallback((messageId: string, reaction: string) => {
    debugLog('sendReaction called', messageId, reaction);
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({ eventType: 'message_reaction', payload: { messageId, reaction } }));
  }, [state.ws]);

  // Auto connect/disconnect on mount/unmount
  useEffect(() => {
    const accessToken = getToken('accessToken');
    debugLog('useEffect [roomId, accessToken] called', { roomId, accessToken });
    if (roomId && accessToken && !connectionState.current.isConnecting && !state.ws && !state.isConnected && !connectionState.current.hasAttemptedConnection) {
      updateConnectionState({ hasAttemptedConnection: true });
      connect(roomId);
    }
    return () => {
      debugLog('Cleanup useEffect [roomId, accessToken ]');
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
  }, [roomId]);

  // Clear messages only on unmount
  useEffect(() => {
    return () => {
      debugLog('[useWebSocket] Cleanup: clear messages on unmount');
      setState(prev => ({ ...prev, messages: [], connectedUsers: [], typing: [] }));
      sentMessageIds.current.clear();
    };
  }, []);

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