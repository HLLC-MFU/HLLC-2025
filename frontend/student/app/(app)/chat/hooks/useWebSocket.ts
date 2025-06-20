import { useEffect, useRef, useState, useCallback } from 'react';
import useProfile from '@/hooks/useProfile';
import { Platform } from 'react-native';
import { Message, ConnectedUser } from '../types/chatTypes';
import { getToken } from '@/utils/storage';
import { CHAT_BASE_URL, WS_BASE_URL } from '../config/chatConfig';

// Constants
const MAX_MESSAGES = 100;
const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECTION_TIMEOUT = 5000;
const PING_INTERVAL = 60000;
const RECONNECT_DELAY = 3000;

interface WebSocketWithHeartbeat extends WebSocket {
  heartbeatInterval?: ReturnType<typeof setInterval>;
}

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
  ws: WebSocketWithHeartbeat | null;
  addMessage: (message: Message) => void;
}

interface ConnectionState {
  isConnecting: boolean;
  hasAttemptedConnection: boolean;
  reconnectAttempts: number;
}

interface WebSocketState {
  ws: WebSocketWithHeartbeat | null;
  isConnected: boolean;
  error: string | null;
  messages: Message[];
  connectedUsers: ConnectedUser[];
  typing: { id: string; name?: string }[];
}

export const useWebSocket = (roomId: string): WebSocketHook => {
  const { user } = useProfile();
  const userId = user?.data[0]?._id;
  
  // Use a single state object to reduce useState calls
  const [state, setState] = useState<WebSocketState>({
    ws: null,
    isConnected: false,
    error: null,
    messages: [],
    connectedUsers: [],
    typing: []
  });

  // Use refs for connection state management
  const connectionState = useRef<ConnectionState>({
    isConnecting: false,
    hasAttemptedConnection: false,
    reconnectAttempts: 0
  });
  
  const sentMessageIds = useRef<Set<string>>(new Set());
  const connectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to update connection state
  const updateConnectionState = useCallback((updates: Partial<ConnectionState>) => {
    connectionState.current = { ...connectionState.current, ...updates };
  }, []);

  // Create message object with proper structure
  const createMessage = useCallback((data: any, isHistory = false): Message => {
    const baseMessage = {
      id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: data.user_id || data.userId,
      senderName: data.username || data.senderName || data.user_id || data.userId,
      timestamp: data.timestamp || new Date().toISOString(),
      isRead: false,
      isTemp: false // Fix linter error by adding isTemp property
    };

    if (data.file_url) {
      const fileUrl = data.file_url.startsWith('http') 
        ? data.file_url 
        : `${CHAT_BASE_URL}/api/uploads/${data.file_url}`;
      
      return {
        ...baseMessage,
        fileUrl,
        fileName: data.file_name,
        fileType: data.file_type,
        type: 'file' as const,
        username: data.username || data.senderName || data.user_id || data.userId || ''
      };
    }

    if (data.stickerId || (data.image && !data.message)) {
      return {
        ...baseMessage,
        image: data.image,
        stickerId: data.stickerId,
        type: 'sticker' as const,
        username: data.username || data.senderName || data.user_id || data.userId || ''
      };
    }

    // Handle text messages with potential replyTo
    let messageContent = data.message;
    let replyTo = undefined;
    if (data.replyTo) {
      replyTo = {
        id: String(data.replyTo.id || data.reply_to_id || ''),
        text: String(data.replyTo.message || data.replyTo.text || ''),
        senderId: String(data.replyTo.user_id || data.replyTo.senderId || ''),
        senderName: String(data.replyTo.username || data.replyTo.senderName || ''),
      };
    } else if (data.reply_to_id) {
      replyTo = {
        id: String(data.reply_to_id),
        text: '',
        senderId: '',
        senderName: '',
      };
    }

    return {
      ...baseMessage,
      text: messageContent,
      type: 'message' as const,
      replyTo,
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
  }, []);

  // Add message with memory management and deduplication
  const addMessage = useCallback((message: Message) => {
    setState(prev => {
      const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Check if message already exists
      if (prev.messages.some(msg => msg.id === messageId) || sentMessageIds.current.has(messageId)) {
        return prev;
      }
      
      const newMessage = { ...message, id: messageId };
      sentMessageIds.current.add(messageId);
      
      const newMessages = [...prev.messages, newMessage];
      return {
        ...prev,
        messages: newMessages.slice(-MAX_MESSAGES)
      };
    });
  }, []);

  // Handle user join/leave
  const handleUserJoin = useCallback((userId: string, username?: string) => {
    if (!userId) return;
    
    console.log('User joined:', userId, username);
    setState(prev => {
      if (prev.connectedUsers.find(u => u.id === userId)) {
        return prev;
      }
      const newUsers = [...prev.connectedUsers, { id: userId, name: username, online: true }];
      return {
        ...prev,
        connectedUsers: newUsers.slice(-50)
      };
    });
  }, []);

  const handleUserLeave = useCallback((userId: string) => {
    if (!userId) return;
    
    console.log('User left:', userId);
    setState(prev => ({
      ...prev,
      connectedUsers: prev.connectedUsers.filter(u => u.id !== userId)
    }));
  }, []);

  // Reconnect logic
  const attemptReconnect = useCallback(() => {
    if (connectionState.current.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, connectionState.current.reconnectAttempts), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnect attempt ${connectionState.current.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
      connectionState.current.reconnectAttempts += 1;
      
      if (state.ws) {
        try {
          state.ws.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
      
      connect(roomId);
    }, delay);
  }, [roomId, state.ws]);

  // WebSocket connection function
  const connect = useCallback(async (roomId: string) => {
    if (!roomId || !userId) {
      console.log('Cannot connect: missing roomId or userId', { roomId, userId });
      return;
    }

    if (connectionState.current.isConnecting) {
      console.log('WebSocket already connecting, skipping...');
      return;
    }

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping...');
      return;
    }

    try {
      updateConnectionState({ isConnecting: true });
      console.log('Starting WebSocket connection...');
      
      const token = await getToken('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Check token expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        throw new Error('Token expired');
      }

      const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${userId}`;
      console.log('Attempting to connect to WebSocket:', {
        url: wsUrl,
        roomId,
        userId,
        platform: Platform.OS
      });
      
      // Close existing connection if any
      if (state.ws) {
        try {
          console.log('Closing existing WebSocket connection...');
          state.ws.close();
        } catch (e) {
          console.error('Error closing existing connection:', e);
        }
        updateState({ ws: null });
      }
      
      const socket = new WebSocket(wsUrl) as WebSocketWithHeartbeat;
      
      // Set connection timeout
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      connectionTimeout.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.log('Connection timeout - socket state:', socket.readyState);
          socket.close();
          updateConnectionState({ isConnecting: false });
          updateState({ error: 'Connection timeout' });
        }
      }, CONNECTION_TIMEOUT);
      
      socket.onopen = () => {
        console.log('WebSocket Connected successfully');
        updateState({
          isConnected: true,
          error: null,
          ws: socket
        });
        updateConnectionState({
          isConnecting: false,
          reconnectAttempts: 0,
          hasAttemptedConnection: false
        });
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }

        // Setup heartbeat
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.ping();
            } catch (err) {
              console.error('Error sending ping:', err);
              clearInterval(pingInterval);
              socket.close();
            }
          } else {
            clearInterval(pingInterval);
          }
        }, PING_INTERVAL);

        socket.heartbeatInterval = pingInterval;
      };

      socket.onclose = (event) => {
        console.log('WebSocket Disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        updateState({ isConnected: false, ws: null });
        updateConnectionState({ isConnecting: false });
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }

        if (socket.heartbeatInterval) {
          clearInterval(socket.heartbeatInterval);
        }
        
        if (event.code !== 1000 && event.code !== 1001) {
          console.log('Abnormal disconnect, attempting reconnect...');
          attemptReconnect();
        } else {
          console.log('Normal disconnect, not attempting reconnect');
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', {
          error,
          readyState: socket.readyState,
          url: wsUrl
        });
        updateState({ error: 'Failed to connect to chat server' });
        updateConnectionState({ isConnecting: false });
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.eventType === 'history') {
            const messageData = data.payload;
            console.log('HISTORY MESSAGE:', messageData);
            if (messageData && messageData.id) {
              try {
                const newMessage = createMessage(messageData, true);
                addMessage(newMessage);
              } catch (parseError) {
                console.error('Error parsing history message:', parseError);
              }
            }
          } else if (data.eventType === 'message') {
            try {
              const messageData = data.payload;
              console.log('NEW MESSAGE:', messageData);
              const isOwnMessage = messageData.userId === userId;
              
              if (!isOwnMessage) {
                const newMessage = createMessage(messageData);
                addMessage(newMessage);
              }
            } catch (parseError) {
              console.error('Error parsing new message:', parseError);
            }
          }
        } catch (err) {
          console.error('Error handling message:', err, event.data);
        }
      };

      updateState({ ws: socket });
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      updateState({ error: 'Failed to create WebSocket connection' });
      updateConnectionState({ isConnecting: false });
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      setTimeout(() => {
        attemptReconnect();
      }, RECONNECT_DELAY);
    }
  }, [roomId, userId, addMessage, attemptReconnect, createMessage, updateState, updateConnectionState]);

  // Initialize connection
  useEffect(() => {
    if (roomId && userId && !connectionState.current.isConnecting && !state.ws && !state.isConnected && !connectionState.current.hasAttemptedConnection) {
      console.log('Initializing WebSocket connection...');
      updateConnectionState({ hasAttemptedConnection: true });
      connect(roomId);
    }
    
    return () => {
      console.log('Cleaning up WebSocket connection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
        connectionTimeout.current = null;
      }
      
      if (state.ws) {
        const socket = state.ws;
        
        if (socket.heartbeatInterval) {
          clearInterval(socket.heartbeatInterval);
        }

        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;
        
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          try {
            socket.close(1000, "Component unmounted");
          } catch (e) {
            console.error('Error closing WebSocket:', e);
          }
        }
      }
      
      updateState({
        connectedUsers: [],
        isConnected: false,
        error: null
      });
      updateConnectionState({
        isConnecting: false,
        hasAttemptedConnection: false
      });
    };
  }, [roomId, userId, connect, updateState, updateConnectionState]);

  // Clear messages when room or user changes
  useEffect(() => {
    console.log('Room or user changed, clearing messages...');
    updateState({
      messages: [],
      connectedUsers: [],
      typing: []
    });
    sentMessageIds.current.clear();
  }, [roomId, userId, updateState]);

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
      console.error('Error sending message:', error);
      updateState({ error: 'Failed to send message' });
    }
  }, [state.ws, updateState]);

  const sendTyping = useCallback(() => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    
    const typingData = {
      eventType: 'typing',
      payload: { typing: true }
    };
    
    state.ws.send(JSON.stringify(typingData));
  }, [state.ws]);

  const sendReadReceipt = useCallback((messageId: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    
    const readData = {
      eventType: 'read_receipt',
      payload: { messageId }
    };
    
    state.ws.send(JSON.stringify(readData));
  }, [state.ws]);

  const sendReaction = useCallback((messageId: string, reaction: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    
    const reactionData = {
      eventType: 'message_reaction',
      payload: { messageId, reaction }
    };
    
    state.ws.send(JSON.stringify(reactionData));
  }, [state.ws]);

  const disconnect = useCallback(() => {
    if (state.ws) {
      state.ws.close();
      updateState({ ws: null });
    }
    updateConnectionState({ hasAttemptedConnection: false });
  }, [state.ws, updateState, updateConnectionState]);

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
    addMessage
  };
};

export default useWebSocket; 