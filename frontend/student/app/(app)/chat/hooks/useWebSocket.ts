import { useEffect, useRef, useState, useCallback } from 'react';
import useProfile from '@/hooks/useProfile';
import { Platform } from 'react-native';
import { Message, ConnectedUser } from '../types/chatTypes';
import { getToken } from '@/utils/storage';

// Use actual IP for Android, localhost for iOS
const WS_BASE_URL = Platform.OS === 'android' 
  ? 'ws://10.0.2.2:1334'  // Android emulator maps 10.0.2.2 to host machine's localhost
  : 'ws://localhost:1334';

// Maximum number of messages to keep in memory
const MAX_MESSAGES = 100;

interface WebSocketWithHeartbeat extends WebSocket {
  heartbeatInterval?: NodeJS.Timeout;
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

export const useWebSocket = (roomId: string): WebSocketHook => {
  const { user } = useProfile();
  const [ws, setWs] = useState<WebSocketWithHeartbeat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [typing, setTyping] = useState<{ id: string; name?: string }[]>([]);
  
  // Keep track of connection state
  const isConnecting = useRef(false);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Keep track of reconnection attempts
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle user joining - memoized to prevent recreations
  const handleUserJoin = useCallback((userId: string, username?: string) => {
    if (!userId) return;
    
    console.log('User joined:', userId, username);
    setConnectedUsers(prev => {
      if (prev.find(u => u.id === userId)) {
        return prev;
      }
      const newUsers = [...prev, { id: userId, name: username, online: true }];
      return newUsers.slice(-50);
    });
  }, []);

  // Function to handle user leaving - memoized
  const handleUserLeave = useCallback((userId: string) => {
    if (!userId) return;
    
    console.log('User left:', userId);
    setConnectedUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  // Add message with memory management
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const newMessage = { 
        ...message, 
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: message.timestamp || new Date().toISOString()
      };
      
      const newMessages = [...prev, newMessage];
      return newMessages.slice(-MAX_MESSAGES);
    });
  }, []);

  // Memoized reconnect function
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnect attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts}`);
      reconnectAttempts.current += 1;
      
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
      
      connect(roomId);
    }, delay);
  }, [roomId, ws]);

  // Connect function to avoid redundant code
  const connect = useCallback(async (roomId: string) => {
    if (!roomId || !user?._id || isConnecting.current) return;

    try {
      isConnecting.current = true;
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

      // Only connect if not already connected
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        isConnecting.current = false;
        return;
      }

      const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${user._id}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      // Close existing connection if any
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          console.error('Error closing existing connection:', e);
        }
        setWs(null);
      }
      
      const socket = new WebSocket(wsUrl) as WebSocketWithHeartbeat;
      
      // Set connection timeout
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      connectionTimeout.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.log('Connection timeout');
          socket.close();
          isConnecting.current = false;
          setError('Connection timeout');
        }
      }, 5000);
      
      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        isConnecting.current = false;
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }

        // Use WebSocket ping/pong frames
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              // Use WebSocket ping frame
              socket.ping();
            } catch (err) {
              console.error('Error sending ping:', err);
              clearInterval(pingInterval);
              socket.close();
            }
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);

        // Store interval ID for cleanup
        socket.heartbeatInterval = pingInterval;
      };

      socket.onclose = (event) => {
        console.log('WebSocket Disconnected', event.code, event.reason);
        setIsConnected(false);
        isConnecting.current = false;
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }

        // Clear heartbeat interval
        if (socket.heartbeatInterval) {
          clearInterval(socket.heartbeatInterval);
        }
        
        if (event.code !== 1000) {
          attemptReconnect();
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setError('Failed to connect to chat server');
        isConnecting.current = false;
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
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
                    senderName: messageData.user_id,
                    type: 'file',
                    timestamp: messageData.timestamp,
                    isRead: false,
                  };
                } else if (messageData.stickerId) {
                  newMessage = {
                    id: messageData.id,
                    image: messageData.image,
                    stickerId: messageData.stickerId,
                    senderId: messageData.user_id,
                    senderName: messageData.user_id,
                    type: 'sticker',
                    timestamp: messageData.timestamp,
                    isRead: false,
                  };
                } else {
                  // Try to parse the message content if it's a JSON string
                  let messageContent = messageData.message;
                  let replyTo = undefined;
                  
                  try {
                    const parsedContent = JSON.parse(messageData.message);
                    if (parsedContent.eventType === 'message' && parsedContent.payload) {
                      messageContent = parsedContent.payload.message;
                      if (parsedContent.payload.replyTo) {
                        replyTo = parsedContent.payload.replyTo;
                      }
                    }
                  } catch (e) {
                    // If parsing fails, use the original message
                    console.log('Message is not JSON, using as is');
                  }
                  
                  newMessage = {
                    id: messageData.id,
                    text: messageContent,
                    senderId: messageData.user_id,
                    senderName: messageData.user_id,
                    type: 'message',
                    timestamp: messageData.timestamp,
                    isRead: false,
                    replyTo: replyTo
                  };
                }

                console.log('Adding history message:', newMessage);
                setMessages(prev => {
                  // Check if message already exists
                  if (prev.some(msg => msg.id === newMessage.id)) {
                    return prev;
                  }
                  const updatedMessages = [...prev, newMessage];
                  console.log('Updated messages after history:', updatedMessages);
                  return updatedMessages;
                });
              } catch (parseError) {
                console.error('Error parsing history message:', parseError);
              }
            }
          } else if (data.eventType === 'sticker') {
            const stickerData = data.payload;
            const newMessage: Message = {
              id: Date.now().toString(),
              text: '',
              senderId: stickerData.userId,
              senderName: stickerData.userId,
              type: 'sticker',
              timestamp: new Date().toISOString(),
              isRead: false,
              stickerId: stickerData.stickerId,
              image: stickerData.sticker
            };
            setMessages(prev => [...prev, newMessage]);
          } else if (data.eventType === 'message') {
            // Handle direct message
            try {
              const messageData = data.payload;
              console.log('Received new message:', messageData);

              // Check if this is our own message (sent by us)
              const isOwnMessage = messageData.userId === user?._id;
              
              // Only add message if it's not our own (since we already added it via addMessage)
              if (!isOwnMessage) {
                let messageContent = messageData.message;
                let replyTo = undefined;
                
                try {
                  const parsedContent = JSON.parse(messageData.message);
                  if (parsedContent.eventType === 'message' && parsedContent.payload) {
                    messageContent = parsedContent.payload.message;
                    if (parsedContent.payload.replyTo) {
                      replyTo = parsedContent.payload.replyTo;
                    }
                  }
                } catch (e) {
                  // If parsing fails, use the original message
                  console.log('Message is not JSON, using as is');
                }
                
                const newMessage = {
                  id: Date.now().toString(),
                  text: messageContent,
                  senderId: messageData.userId,
                  senderName: messageData.userId,
                  type: 'message' as const,
                  timestamp: new Date().toISOString(),
                  isRead: false,
                  replyTo: replyTo
                };
                console.log('Adding new message:', newMessage);
                setMessages(prev => {
                  const updatedMessages = [...prev, newMessage];
                  console.log('Updated messages after new message:', updatedMessages);
                  return updatedMessages;
                });
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
      setError('Failed to create WebSocket connection');
      isConnecting.current = false;
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      // Don't attempt reconnect immediately on error
      setTimeout(() => {
        attemptReconnect();
      }, 3000);
    }
  }, [roomId, user?._id, addMessage, attemptReconnect]);

  useEffect(() => {
    if (roomId && user?._id && !isConnecting.current) {
      connect(roomId);
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
        connectionTimeout.current = null;
      }
      
      if (ws) {
        const socket = ws;
        
        // Clear heartbeat interval
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
      
      setMessages([]);
      setConnectedUsers([]);
      setIsConnected(false);
      setError(null);
      isConnecting.current = false;
    };
  }, [roomId, user?._id]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('Not connected to chat server');
      return;
    }

    try {
      // Send message directly
      ws.send(message);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  }, [ws]);

  // Send typing event
  const sendTyping = useCallback(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    const typingData = {
      eventType: 'typing',
      payload: {
        typing: true
      }
    };
    
    ws.send(JSON.stringify(typingData));
  }, [ws]);

  // Send read receipt
  const sendReadReceipt = useCallback((messageId: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
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
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
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
    isConnected,
    error,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendReaction,
    messages,
    connectedUsers,
    typing,
    connect,
    disconnect,
    ws,
    addMessage
  };
}; 