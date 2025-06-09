import { useEffect, useRef, useState, useCallback } from 'react';
import useProfile from '@/hooks/useProfile';
import { Platform } from 'react-native';
import { Message, ConnectedUser } from '../types/chatTypes';
import { getToken } from '@/utils/storage';
import { WS_BASE_URL } from '../config/chatConfig';

// Rename to WebSocketReadyState to avoid conflict with global WebSocket
type WebSocketReadyState = {
  OPEN: number;
  CONNECTING: number;
  CLOSING: number;
  CLOSED: number;
};

const WS_READY_STATE: WebSocketReadyState = {
  OPEN: 1,
  CONNECTING: 0,
  CLOSING: 2,
  CLOSED: 3
};

// Maximum number of messages to keep in memory
const MAX_MESSAGES = 100;

// Connection management constants
const CONNECTION_TIMEOUT = 10000;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 10000;
const NORMAL_CLOSURE_CODES = [1000, 1001]; // Add 1001 (going away) as normal closure

interface WebSocketWithHeartbeat extends WebSocket {
  pingInterval?: ReturnType<typeof setInterval>;
  pongTimeout?: ReturnType<typeof setTimeout>;
  lastPongTime?: number;
  isNormalClosure?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  messages: Message[];
  connectedUsers: ConnectedUser[];
  isTyping: boolean;
}

export interface WebSocketHook {
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
  sendReadReceipt: (messageId: string) => void;
  sendReaction: (messageId: string, reaction: string) => void;
  messages: Message[];
  connectedUsers: ConnectedUser[];
  connect: (roomId: string) => Promise<void>;
  disconnect: () => void;
  ws: WebSocketWithHeartbeat | null;
  addMessage: (message: Message) => void;
  isTyping: boolean;
}

export const useWebSocket = (roomId: string): WebSocketHook => {
  const { user } = useProfile();
  const [ws, setWs] = useState<WebSocketWithHeartbeat | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    messages: [],
    connectedUsers: [],
    isTyping: false
  });
  
  // Keep track of sent message IDs to prevent duplicates
  const sentMessageIds = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Keep track of connection state
  const isConnecting = useRef(false);
  const connectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Keep track of reconnection attempts
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remove heartbeat related state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add state for connection status
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const isNormalClosure = useRef(false);

  // Update state helper
  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Function to handle user joining - memoized to prevent recreations
  const handleUserJoin = useCallback((userId: string, username?: string) => {
    if (!userId) return;
    
    console.log('User joined:', userId, username);
    updateState({
      connectedUsers: [...state.connectedUsers, { id: userId, name: username, online: true }].slice(-50)
    });
  }, [state.connectedUsers, updateState]);

  // Function to handle user leaving - memoized
  const handleUserLeave = useCallback((userId: string) => {
    if (!userId) return;
    
    console.log('User left:', userId);
    updateState({
      connectedUsers: state.connectedUsers.filter((u: ConnectedUser) => u.id !== userId)
    });
  }, [state.connectedUsers, updateState]);

  // Add message with memory management and deduplication
  const addMessage = useCallback((message: Message) => {
    setState((prev: WebSocketState) => {
      // Check if message already exists
      if (prev.messages.some((msg: Message) => msg.id === message.id) || 
          (message.id && sentMessageIds.current.has(message.id))) {
        return prev;
      }
      
      const newMessage = { 
        ...message, 
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: message.timestamp || new Date().toISOString()
      };
      
      if (newMessage.id) {
        sentMessageIds.current.add(newMessage.id);
      }
      
      const newMessages = [...prev.messages, newMessage].slice(-MAX_MESSAGES);
      return { ...prev, messages: newMessages };
    });
  }, []);

  // Forward declare connect function type
  type ConnectFunction = (roomId: string) => Promise<void>;

  // Function to check connection using pong timeout
  const checkPongTimeout = useCallback(() => {
    if (!ws) return;
    
    const now = Date.now();
    const lastPong = (ws as WebSocketWithHeartbeat).lastPongTime || 0;
    
    if (now - lastPong > PONG_TIMEOUT) {
      console.log('Pong timeout - connection seems dead');
      ws.close();
    }
  }, [ws]);

  // Function to send ping
  const sendPing = useCallback(() => {
    if (!ws || ws.readyState !== WS_READY_STATE.OPEN) return;
    
    try {
      // Clear any existing pong timeout
      if (pongTimeoutRef.current) {
        clearTimeout(pongTimeoutRef.current);
      }
      
      // Send ping
      ws.send(JSON.stringify({ type: 'ping' }));
      
      // Set pong timeout
      pongTimeoutRef.current = setTimeout(() => {
        checkPongTimeout();
      }, PONG_TIMEOUT) as unknown as ReturnType<typeof setTimeout>;
      
    } catch (err) {
      console.error('Error sending ping:', err);
      if (ws) ws.close();
    }
  }, [ws, checkPongTimeout]);

  // Memoized reconnect function with improved backoff
  const attemptReconnect = useCallback((): void => {
    if (isReconnecting || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnect attempts reached or already reconnecting');
      return;
    }
    
    setIsReconnecting(true);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current), MAX_RECONNECT_DELAY);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnect attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS}`);
      reconnectAttempts.current += 1;
      
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          console.error('Error closing existing connection:', e);
        }
      }
      
      connect(roomId).finally(() => {
        setIsReconnecting(false);
      });
    }, delay) as unknown as ReturnType<typeof setTimeout>;
  }, [roomId, ws, isReconnecting]);

  // Function to update connection status
  const updateConnectionStatus = useCallback((status: 'connecting' | 'connected' | 'disconnected') => {
    setConnectionStatus(status);
    updateState({ 
      isConnected: status === 'connected',
      error: status === 'disconnected' ? 'Disconnected from chat server' : null 
    });
  }, [updateState]);

  // Connect function with improved status handling
  const connect: ConnectFunction = useCallback(async (roomId: string) => {
    if (!roomId || !user?.data[0]._id) {
      console.log('Cannot connect: missing roomId or userId');
      return;
    }

    if (isConnecting.current || (ws && ws.readyState === WS_READY_STATE.OPEN)) {
      console.log('WebSocket already connecting or connected');
      return;
    }

    try {
      isConnecting.current = true;
      updateConnectionStatus('connecting');
      
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

      const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${user?.data[0]._id}`;
      console.log('Attempting to connect to WebSocket:', {
        url: wsUrl,
        roomId,
        userId: user?.data[0]._id,
        platform: Platform.OS
      });
      
      // Close existing connection if any
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          console.error('Error closing existing connection:', e);
        }
        setWs(null);
      }
      
      const socket = new globalThis.WebSocket(wsUrl) as WebSocketWithHeartbeat;
      socket.isNormalClosure = false;
      
      // Set connection timeout
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      connectionTimeout.current = setTimeout(() => {
        if (socket.readyState !== WS_READY_STATE.OPEN) {
          console.log('Connection timeout - socket state:', socket.readyState);
          socket.close();
          isConnecting.current = false;
          updateConnectionStatus('disconnected');
          attemptReconnect();
        }
      }, CONNECTION_TIMEOUT) as unknown as ReturnType<typeof setTimeout>;
      
      socket.onopen = () => {
        console.log('WebSocket connected successfully');
        isConnecting.current = false;
        reconnectAttempts.current = 0;
        updateConnectionStatus('connected');
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        pingIntervalRef.current = setInterval(() => {
          sendPing();
        }, PING_INTERVAL) as unknown as ReturnType<typeof setInterval>;

        socket.pingInterval = pingIntervalRef.current as unknown as number;
        socket.lastPongTime = Date.now();
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        isConnecting.current = false;
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current);
        }

        const isNormal = NORMAL_CLOSURE_CODES.includes(event.code);
        socket.isNormalClosure = isNormal;
        
        if (!isNormal) {
          updateConnectionStatus('disconnected');
          attemptReconnect();
        } else {
          updateConnectionStatus('disconnected');
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        isConnecting.current = false;
        updateConnectionStatus('disconnected');
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong response
          if (data.type === 'pong') {
            (socket as WebSocketWithHeartbeat).lastPongTime = Date.now();
            if (pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current);
            }
            return;
          }
          
          // Handle heartbeat response
          if (data.type === 'heartbeat') {
            return;
          }
          
          // Handle different event types
          if (data.eventType === 'history') {
            if (data.payload?.chat) {
              try {
                const messageData = data.payload.chat;
                console.log('Parsed history message:', messageData);
                
                let newMessage: Message;
                
                if (messageData.file_url) {
                  newMessage = {
                    id: messageData.id,
                    fileUrl: messageData.file_url,
                    fileName: messageData.file_name,
                    fileType: messageData.file_type,
                    senderId: messageData.user_id,
                    senderName: messageData.sender_name || messageData.user_id,
                    type: 'file',
                    timestamp: messageData.timestamp,
                    isRead: false,
                  };
                } else if (messageData.stickerId) {
                  newMessage = {
                    id: messageData.id,
                    stickerId: messageData.stickerId,
                    image: messageData.image,
                    senderId: messageData.user_id,
                    senderName: messageData.sender_name || messageData.user_id,
                    type: 'sticker',
                    timestamp: messageData.timestamp,
                    isRead: false,
                  };
                } else {
                  newMessage = {
                    id: messageData.id,
                    text: messageData.message,
                    senderId: messageData.user_id,
                    senderName: messageData.sender_name || messageData.user_id,
                    type: 'message',
                    timestamp: messageData.timestamp,
                    isRead: false
                  };
                }

                console.log('Adding history message:', newMessage);
                addMessage(newMessage);
              } catch (parseError) {
                console.error('Error parsing history message:', parseError);
              }
            }
          } else if (data.eventType === 'message' || data.eventType === 'sticker' || data.eventType === 'image') {
            try {
              const messageData = data.payload;
              console.log('Received new message:', messageData);

              const isOwnMessage = messageData.userId === user?.data[0]._id;
              
              if (!isOwnMessage) {
                let newMessage: Message;

                if (data.eventType === 'sticker') {
                  newMessage = {
                    id: Date.now().toString(),
                    stickerId: messageData.stickerId,
                    image: messageData.image,
                    senderId: messageData.userId,
                    senderName: messageData.senderName || messageData.userId,
                    type: 'sticker',
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    isRead: false
                  };
                } else if (data.eventType === 'image') {
                  newMessage = {
                    id: Date.now().toString(),
                    fileUrl: messageData.imageUrl,
                    fileName: messageData.fileName,
                    fileType: messageData.fileType,
                    senderId: messageData.userId,
                    senderName: messageData.senderName || messageData.userId,
                    type: 'file',
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    isRead: false
                  };
                } else {
                  newMessage = {
                    id: Date.now().toString(),
                    text: messageData.message,
                    senderId: messageData.userId,
                    senderName: messageData.senderName || messageData.userId,
                    type: 'message',
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    isRead: false
                  };
                }

                console.log('Adding new message:', newMessage);
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

      setWs(socket);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      isConnecting.current = false;
      updateConnectionStatus('disconnected');
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      setTimeout(() => {
        attemptReconnect();
      }, RECONNECT_DELAY);
    }
  }, [roomId, user?.data[0]._id, attemptReconnect, sendPing, updateConnectionStatus]);

  // Cleanup on unmount with improved status handling
  useEffect(() => {
    return () => {
      if (ws) {
        const socket = ws;
        socket.isNormalClosure = true; // Mark as normal closure for cleanup
        
        if (socket.pingInterval) {
          clearInterval(socket.pingInterval);
        }

        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;
        
        if (socket.readyState === WS_READY_STATE.OPEN || socket.readyState === WS_READY_STATE.CONNECTING) {
          try {
            socket.close(1000, "Component unmounted");
          } catch (e) {
            console.error('Error closing WebSocket:', e);
          }
        }
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (pongTimeoutRef.current) {
        clearTimeout(pongTimeoutRef.current);
      }
      
      updateState({ 
        messages: [], 
        connectedUsers: [], 
        isConnected: false, 
        error: null 
      });
      updateConnectionStatus('disconnected');
      isConnecting.current = false;
    };
  }, [roomId, user?.data[0]._id, updateConnectionStatus]);

  // Add effect to handle connection status changes
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !isNormalClosure.current) {
      console.log('Connection status changed to disconnected, attempting reconnect...');
      attemptReconnect();
    }
  }, [connectionStatus, attemptReconnect]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!ws || ws.readyState !== WS_READY_STATE.OPEN) {
      updateState({ error: 'Not connected to chat server' });
      return;
    }

    if (!user?.data[0]._id) {
      updateState({ error: 'User ID not found' });
      return;
    }

    try {
      // Parse the message if it's a JSON string
      let messageContent = message;
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.eventType === 'message' && parsedMessage.payload) {
          messageContent = parsedMessage.payload.message;
        }
      } catch (e) {
        // If parsing fails, use the original message
        console.log('Message is not JSON, using as is');
      }

      const userId = user.data[0]._id;

      // Create the message in the format expected by the database
      const dbMessage = {
        room_id: roomId,
        user_id: userId,
        message: messageContent,
        timestamp: new Date().toISOString()
      };

      // Send the raw message directly to the WebSocket server
      ws.send(JSON.stringify(dbMessage));

      // Add message to local state
      const tempMessage: Message = {
        id: Date.now().toString(),
        text: messageContent,
        senderId: userId,
        senderName: userId,
        type: 'message',
        timestamp: new Date().toISOString(),
        isRead: false
      };
      addMessage(tempMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      updateState({ error: 'Failed to send message' });
    }
  }, [ws, roomId, user?.data[0]._id, updateState, addMessage]);

  // Send read receipt
  const sendReadReceipt = useCallback((messageId: string) => {
    if (!ws || ws.readyState !== WS_READY_STATE.OPEN) return;
    
    const readData = {
      eventType: 'read_receipt',
      payload: {
        messageId
      }
    };
    
    ws.send(JSON.stringify(readData));
  }, [ws]);

  // Send reaction
  const sendReaction = useCallback((messageId: string, reaction: string) => {
    if (!ws || ws.readyState !== WS_READY_STATE.OPEN) return;
    
    const reactionData = {
      eventType: 'message_reaction',
      payload: {
        messageId,
        reaction
      }
    };
    
    ws.send(JSON.stringify(reactionData));
  }, [ws]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  }, [ws]);

  return {
    ...state,
    sendMessage,
    sendReadReceipt,
    sendReaction,
    connect,
    disconnect,
    ws,
    addMessage
  };
}; 