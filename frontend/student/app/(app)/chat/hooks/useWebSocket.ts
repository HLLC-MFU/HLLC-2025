import { useEffect, useRef, useState, useCallback } from 'react';
import useProfile from '@/hooks/useProfile';
import { Platform } from 'react-native';
import { Message, ConnectedUser } from '../types/chatTypes';

// Use actual IP for Android, localhost for iOS
const WS_BASE_URL = Platform.OS === 'android' 
  ? 'ws://10.0.2.2:1334'  // Android emulator maps 10.0.2.2 to host machine's localhost
  : 'ws://localhost:1334';

// Maximum number of messages to keep in memory
const MAX_MESSAGES = 100;

interface WebSocketHook {
  isConnected: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  messages: Message[];
  connectedUsers: ConnectedUser[];
  connectedCount: number;
  ws: WebSocket | null;
  typing: Array<{ id: string; name?: string }>;
}

export const useWebSocket = (roomId: string): WebSocketHook => {
  const { user } = useProfile();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [typing, setTyping] = useState<Array<{ id: string; name?: string }>>([]);
  
  // Keep track of reconnection attempts
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const token = user?.token;

  // Function to handle user joining - memoized to prevent recreations
  const handleUserJoin = useCallback((username: string) => {
    if (!username) return;
    
    console.log('User joined:', username);
    setConnectedUsers(prev => {
      // Don't add if already in the list
      if (prev.find(u => u.id === username)) {
        return prev;
      }
      // Limit the number of users in memory
      const newUsers = [...prev, { 
        id: username,
        name: username,
        online: true
      }];
      
      // Only keep most recent 50 users
      return newUsers.slice(-50);
    });
  }, []);

  // Function to handle user leaving - memoized
  const handleUserLeave = useCallback((username: string) => {
    if (!username) return;
    
    console.log('User left:', username);
    setConnectedUsers(prev => prev.filter(u => u.id !== username));
  }, []);

  // Add message with memory management
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Add id and timestamp if not present
      const newMessage = { 
        ...message, 
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: message.timestamp || new Date().toISOString()
      };
      
      // Limit the messages in memory to prevent excessive growth
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
      
      // Recreate the connection
      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
      
      connect();
    }, delay);
  }, []);

  // Connect function to avoid redundant code
  const connect = useCallback(() => {
    if (!roomId || !user?.username || !token) return;

    const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${user.username}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    try {
      ws.current = new WebSocket(wsUrl);
      
      // Add token to the WebSocket connection
      ws.current.onopen = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket Disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Only try to reconnect if this wasn't a normal closure
        if (event.code !== 1000) {
          attemptReconnect();
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setError('Failed to connect to chat server');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'auth_success') {
            setIsConnected(true);
            setError(null);
            reconnectAttempts.current = 0;
            return;
          }

          if (data.type === 'auth_error') {
            setError('Authentication failed');
            return;
          }

          if (data.type === 'users') {
            setConnectedUsers(data.users.map((id: string) => ({
              id,
              name: id,
              online: true
            })));
            return;
          }

          if (data.type === 'join') {
            handleUserJoin(data.userId);
            addMessage({
              text: `${data.userId} joined the room`,
              senderId: data.userId,
              type: 'join',
              timestamp: new Date().toISOString()
            });
            return;
          }

          if (data.type === 'leave') {
            handleUserLeave(data.userId);
            addMessage({
              text: `${data.userId} left the room`,
              senderId: data.userId,
              type: 'leave',
              timestamp: new Date().toISOString()
            });
            return;
          }

          if (data.type === 'message') {
            addMessage({
              text: data.text,
              senderId: data.senderId,
              type: 'message',
              timestamp: data.timestamp || new Date().toISOString()
            });
            return;
          }
        } catch (err) {
          console.error('Error handling message:', err, event.data);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
      attemptReconnect();
    }
  }, [roomId, user?.username, token, handleUserJoin, handleUserLeave, addMessage, attemptReconnect]);

  useEffect(() => {
    connect();
    
    // Cleanup function to handle component unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (ws.current) {
        // Use a local variable to avoid closure issues
        const socket = ws.current;
        
        // Set onclose to null to prevent reconnection attempts during unmount
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;
        
        // Close the connection
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          try {
            socket.close(1000, "Component unmounted");
          } catch (e) {
            console.error('Error closing WebSocket:', e);
          }
        }
      }
      
      // Clear state on unmount
      setMessages([]);
      setConnectedUsers([]);
      setIsConnected(false);
      setError(null);
    };
  }, [connect]);

  // Memoized function to send messages
  const sendMessage = useCallback((text: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to chat server');
      return;
    }

    // Add message to local state optimistically
    addMessage({
      text: text,
      senderId: user?.id || '',
      type: 'message',
      timestamp: new Date().toISOString()
    });

    // Send the message to the server
    ws.current.send(JSON.stringify({
      type: 'message',
      text
    }));
  }, [user?.id, addMessage]);

  return {
    isConnected,
    error,
    sendMessage,
    messages,
    connectedUsers,
    connectedCount: connectedUsers.length,
    ws: ws.current,
    typing
  };
}; 