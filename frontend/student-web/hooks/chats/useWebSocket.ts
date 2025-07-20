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
  sendReadReceipt: (messageId: string) => void;
  messages: Message[];
  connectedUsers: ConnectedUser[];
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

// Utility function to generate unique message IDs
const generateUniqueMessageId = (prefix: string = 'msg'): string => {
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random1}-${random2}`;
};

// Patch onMessage to handle unsend event and remove message from state
function onMessage(event: MessageEvent, args: any) {
  const { state, addMessage, userId, setState } = args;
  try {
    const data = JSON.parse(event.data);
    debugLog('[onMessage] Received:', data);

    // Block system messages that shouldn't be displayed in chat
    if (data.type === 'room_status' || data.eventType === 'room_status') {
      debugLog('[onMessage] Blocking room_status message:', data);
      return; // Don't add to chat messages
    }

    // Block other system messages
    const systemMessageTypes = [
      'room_status',
      'user_status',
      'connection_status',
      'ping',
      'pong',
      'heartbeat',
      'system_notification',
      'user_kicked' // Block user_kicked messages from showing in chat
    ];

    if (systemMessageTypes.includes(data.type) || systemMessageTypes.includes(data.eventType)) {
      debugLog('[onMessage] Blocking system message:', data);
      return; // Don't add to chat messages
    }

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

    // Handle restriction events FIRST (ban, unban, mute, unmute, kick)
    const restrictionTypes = ['restriction_ban', 'restriction_unban', 'restriction_mute', 'restriction_unmute', 'restriction_kick'];
    if (restrictionTypes.includes(data.type)) {
      debugLog('[onMessage] Processing restriction event:', data);
      
      // Extract data from payload
      const user = data.payload?.user || { username: 'Unknown User' };
      const message = data.payload?.message || {};
      const restrictionText = message.message || data.payload?.message?.message || '';
      
      // Map restriction types to display types
      let actionType = data.type.replace('restriction_', ''); // ban, unban, mute, unmute, kick
      
      const restrictionMessage = {
        id: generateUniqueMessageId('restriction'),
        type: 'restriction',
        subType: actionType, // ban, unban, mute, unmute, kick
        user: user,
        timestamp: data.payload?.timestamp || data.timestamp || new Date().toISOString(),
        text: restrictionText,
        username: user.username || 'Unknown User',
        restrictionData: {
          action: actionType,
          restriction: data.payload?.restriction,
          room: data.payload?.room
        }
      };

      const newMessage = require('@/hooks/chats/messageUtils').createMessage(restrictionMessage, false);
      debugLog('[onMessage] Adding restriction message:', newMessage);
      if (newMessage) addMessage(newMessage);
      return;
    }

    // --- FIX: Properly distinguish sticker messages ---
    if (data.type && data.payload) {
      let msg;
      let user = data.payload.user || {};
      let extra: any = {};
      if (data.type === 'sticker') {
        // Sticker message: force type and stickerId
        msg = data.payload.message || {};
        extra.stickerId = data.payload.sticker?._id || msg.stickerId;
        extra.type = 'sticker';
        if (data.payload.sticker?.image) {
          extra.image = data.payload.sticker.image;
        }
      } else {
        // Default logic for other types
        switch (data.type) {
          case 'message':
            msg = data.payload.message;
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
          case 'evoucher':
            // Handle evoucher messages - pass the entire payload structure
            msg = data.payload;
            extra.type = 'evoucher';
            extra.payload = data.payload; // Include the full payload
            break;
          default:
            msg = data.payload.message;
        }
      }
      if (msg) {
        // --- ตัด message.message ให้เหลือข้อความจริง ถ้าเป็น JSON string ---
        if (msg && typeof msg.message === 'string') {
          try {
            const parsed = JSON.parse(msg.message);
            if (parsed && parsed.payload && typeof parsed.payload.message === 'string') {
              msg.message = parsed.payload.message;
            }
          } catch (e) {
            // ถ้า parse ไม่ได้ก็ข้ามไป
          }
        }
        // --- Always set type for sticker ---
        if (data.type === 'sticker') {
          msg.type = 'sticker';
          if (extra.stickerId) msg.stickerId = extra.stickerId;
          if (extra.image) msg.image = extra.image;
        }
        const messageData = {
          ...msg,
          user,
          user_id: user._id,
          username: user.username,
          ...extra,
        };



        const newMessage = require('@/hooks/chats/messageUtils').createMessage(messageData, true);
        debugLog(`[onMessage] Adding ${data.type} message:`, newMessage);
        if (newMessage) addMessage(newMessage);
      }
      return;
    }
    // Handle join/leave events - backend sends proper payload structure
    if (data.eventType === 'user_joined' || data.type === 'user_joined') {
      debugLog('[onMessage] Processing user_joined event:', data);
      debugLog('[onMessage] User data from payload:', data.payload?.user);

      // Backend should send: { eventType: "user_joined", payload: { user: { username: "...", ... } } }
      let user = data.payload?.user;
      
      // Debug what we got
      if (user) {
        debugLog('[onMessage] Found user in payload:', user);
        debugLog('[onMessage] Username:', user.username);
      } else {
        debugLog('[onMessage] No user in payload, data structure:', Object.keys(data));
      }
      
      // If no user object in payload, try to construct from available data
      if (!user && data.userId) {
        debugLog('[onMessage] No user object, trying to use userId:', data.userId);
        user = { 
          _id: data.userId, 
          username: `User_${data.userId.slice(-4)}` // Use last 4 chars of userId as fallback
        };
      }
      
      // Final fallback
      if (!user) {
        debugLog('[onMessage] No user data available, using fallback');
        user = { username: 'Unknown User' };
      }

      const joinMessage = {
        id: generateUniqueMessageId('join'),
        type: 'join',
        user: user,
        timestamp: data.payload?.timestamp || data.timestamp || new Date().toISOString(),
        text: '',
        username: user.username || 'Unknown User'
      };

      debugLog('[onMessage] Final join message:', joinMessage);
      const newMessage = require('@/hooks/chats/messageUtils').createMessage(joinMessage, false);
      debugLog('[onMessage] Adding join message:', newMessage);
      if (newMessage) addMessage(newMessage);
      return;
    }

    if (data.eventType === 'user_left' || data.type === 'user_left') {
      debugLog('[onMessage] Processing user_left event:', data);
      debugLog('[onMessage] User data from payload:', data.payload?.user);

      // Backend should send: { eventType: "user_left", payload: { user: { username: "...", ... } } }
      let user = data.payload?.user;
      
      // Debug what we got
      if (user) {
        debugLog('[onMessage] Found user in payload:', user);
        debugLog('[onMessage] Username:', user.username);
      } else {
        debugLog('[onMessage] No user in payload, data structure:', Object.keys(data));
      }
      
      // If no user object in payload, try to construct from available data
      if (!user && data.userId) {
        debugLog('[onMessage] No user object, trying to use userId:', data.userId);
        user = { 
          _id: data.userId, 
          username: `User_${data.userId.slice(-4)}` // Use last 4 chars of userId as fallback
        };
      }
      
      // Final fallback
      if (!user) {
        debugLog('[onMessage] No user data available, using fallback');
        user = { username: 'Unknown User' };
      }

      const leaveMessage = {
        id: generateUniqueMessageId('leave'),
        type: 'leave',
        user: user,
        timestamp: data.payload?.timestamp || data.timestamp || new Date().toISOString(),
        text: '',
        username: user.username || 'Unknown User'
      };

      debugLog('[onMessage] Final leave message:', leaveMessage);
      const newMessage = require('@/hooks/chats/messageUtils').createMessage(leaveMessage, false);
      debugLog('[onMessage] Adding leave message:', newMessage);
      if (newMessage) addMessage(newMessage);
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
    baseOnMessage(event, args);
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

  const wsRef = useRef<WebSocket | null>(null);

  const [state, setState] = useState<Omit<WebSocketState, 'ws'>>({
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

  const { updateState, updateConnectionState } = useStateUtils(setState as React.Dispatch<React.SetStateAction<any>>, connectionState);

  const addMessage = useCallback((message: Message | null) => {
    if (!message) return;

    // Generate a more unique ID if not present
    if (!message.id) {
      message.id = generateUniqueMessageId();
    }



    setState(prev => {
      const messageId = message.id || '';
      if (!messageId) return prev;

      // Improved deduplication logic
      const isDuplicate = prev.messages.some(msg => {
        // First check: exact ID match (most reliable)
        if (msg.id === messageId) {
          return true;
        }

        // Second check: if both messages have IDs but they're different, they're not duplicates
        if (msg.id && messageId && msg.id !== messageId) {
          return false;
        }

        // Third check: only compare content for temporary messages within a very short time window
        // This prevents blocking real messages that might have similar content
        if (message.isTemp && msg.isTemp) {
          const timeDiff = Math.abs(new Date(message.timestamp).getTime() - new Date(msg.timestamp).getTime());
          if (timeDiff < 1000) { // Reduced to 1 second window for temp messages only
            const contentMatch = (
              msg.text === message.text &&
              msg.user?._id === message.user?._id &&
              msg.type === message.type
            );
            if (contentMatch) {
              return true;
            }
          }
        }

        // Fourth check: for non-temp messages, only block if they have the exact same ID
        // This allows similar content messages to be sent
        if (!message.isTemp && !msg.isTemp) {
          // Only block if they have the same ID, not based on content
          return false;
        }

        return false;
      });

      if (isDuplicate) {
        debugLog('[addMessage] Duplicate message detected, skipping:', messageId);
        return prev;
      }

      if (isDuplicate) {
        debugLog('[addMessage] duplicate message detected:', {
          messageId,
          text: message.text,
          userId: message.user?._id,
          type: message.type,
          isTemp: message.isTemp
        });
        return prev;
      }

      // Remove temporary messages with same content from same user
      let filteredMessages = prev.messages;
      if (!message.isTemp && message.text) {
        const beforeCount = filteredMessages.length;
        filteredMessages = prev.messages.filter(
          m => !(m.isTemp && m.text === message.text && m.user?._id === message.user?._id)
        );
        const afterCount = filteredMessages.length;
        if (beforeCount !== afterCount) {
          debugLog('[addMessage] Removed temp messages:', beforeCount - afterCount);
        }
      }

      const newMessages = [...filteredMessages, message].slice(-MAX_MESSAGES);
      debugLog('[addMessage] adding new message:', {
        id: message.id,
        text: typeof message.text === 'string' ? (message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')) : '',
        userId: message.user?._id,
        type: message.type,
        isTemp: message.isTemp,
        totalMessages: newMessages.length
      });

      return { ...prev, messages: newMessages };
    });
  }, []);

  const connect = useCallback(async (roomIdParam?: string) => {
    const rid = roomIdParam || roomId || '';
    debugLog('[WebSocket] Attempting to connect...', {
      roomId: rid,
      isConnecting: connectionState.current.isConnecting,
      hasExistingConnection: !!(wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
    });

    if (!rid) {
      warnLog('[WebSocket] No roomId provided, cannot connect');
      updateState({ error: 'No roomId provided' });
      return;
    }
    if (connectionState.current.isConnecting) {
      debugLog('Already connecting, skipping');
      return;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      debugLog('WebSocket already open, skipping');
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
      const wsUrl = getWebSocketUrl(rid, token);
      debugLog('Connecting to WebSocket URL:', wsUrl);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { }
      }
      const socket: any = new WebSocket(wsUrl);
      wsRef.current = socket; // <-- set wsRef
      debugLog('WebSocket object created:', socket);
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
        // Don't log the error object directly as it may contain circular references
        warnLog('WebSocket connection error occurred - this is normal during connection attempts');

        // Only update error state if we're not in a reconnection attempt
        if (!connectionState.current.isConnecting) {
          updateState({ error: 'WebSocket connection error' });
        }

        // Don't trigger immediate reconnection on error - let onclose handle it
        debugLog('[WebSocket] Error event details:', {
          type: error.type,
          readyState: socket.readyState,
          timestamp: new Date().toISOString()
        });
      };
    } catch (error) {
      errorLog('Failed to create WebSocket connection:', error);
      updateState({ error: 'Failed to create WebSocket connection' });
      updateConnectionState({ isConnecting: false });
      setTimeout(() => {
        attemptReconnect({ connectionState, reconnectTimeoutRef, state, connect, roomId: rid, MAX_RECONNECT_ATTEMPTS });
      }, RECONNECT_DELAY);
    }
  }, [addMessage, updateState, updateConnectionState, roomId]); // REMOVE state.ws from deps

  // Disconnect logic
  const disconnect = useCallback(() => {
    debugLog('Disconnect called');
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { }
      wsRef.current = null;
    }
    updateConnectionState({ hasAttemptedConnection: false });
  }, [updateState, updateConnectionState]);

  const sendMessage = useCallback(async (message: any): Promise<boolean> => {
    // ส่ง message เป็น string ธรรมดาเท่านั้น
    let cleanMessage: string = '';
    if (typeof message === 'string') {
      cleanMessage = message;
    } else if (message && typeof message.text === 'string') {
      cleanMessage = message.text;
    } else {
      cleanMessage = String(message ?? '');
    }
    const ws = wsRef.current;
    debugLog('[WebSocket] sendMessage called', { message: cleanMessage, readyState: ws?.readyState, ws });

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      errorLog('[WebSocket] Not connected to chat server, attempting to reconnect...');
      try {
        await connect(roomId);
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
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
      wsRef.current!.send(cleanMessage);
      debugLog('[WebSocket] Sent successfully', { wsRef: wsRef.current, readyState: wsRef.current?.readyState });
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
  }, [updateState, connect, roomId]);

  const sendReadReceipt = useCallback((messageId: string) => {
    debugLog('sendReadReceipt called', messageId);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ eventType: 'read_receipt', payload: { messageId } }));
  }, []);


  // Auto connect/disconnect on mount/unmount
  useEffect(() => {
    const accessToken = getToken('accessToken');
    debugLog('useEffect [roomId, accessToken] called', { roomId, accessToken });

    // Only attempt connection if we have both roomId and token, and haven't already attempted
    if (roomId && accessToken && !connectionState.current.hasAttemptedConnection) {
      updateConnectionState({ hasAttemptedConnection: true });
      connect(roomId);
    }
    return () => {
      debugLog('Cleanup useEffect [roomId, accessToken ]');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      if (wsRef.current) {
        const socket = wsRef.current;
        if ((socket as any).heartbeatInterval) clearInterval((socket as any).heartbeatInterval);
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          try { socket.close(1000, 'Component unmounted'); } catch { }
        }
        wsRef.current = null;
      }
      updateState({ connectedUsers: [], isConnected: false, error: null });
      updateConnectionState({ isConnecting: false, hasAttemptedConnection: false });
    };
  }, [roomId]);

  // Clear messages only on unmount
  useEffect(() => {
    return () => {
      debugLog('[useWebSocket] Cleanup: clear messages on unmount');
      setState(prev => ({ ...prev, messages: [], connectedUsers: [] }));
      sentMessageIds.current.clear();
    };
  }, []);

  return {
    isConnected: state.isConnected,
    error: state.error,
    sendMessage,
    sendReadReceipt,
    messages: state.messages,
    connectedUsers: state.connectedUsers,
    connect,
    disconnect,
    ws: wsRef.current,
    addMessage,
  };
};

export default useWebSocket; 