import { useEffect, useRef, useState } from 'react';
import useProfile from '@/hooks/useProfile';
import { Platform } from 'react-native';

// Use actual IP for Android, localhost for iOS
const WS_BASE_URL = Platform.OS === 'android' 
  ? 'ws://10.0.2.2:1334'  // Android emulator maps 10.0.2.2 to host machine's localhost
  : 'ws://localhost:1334';

interface Message {
  text: string;
  senderId: string;
  type: 'message' | 'join' | 'leave';
}

interface ConnectedUser {
  id: string;
  joinedAt: Date;
}

export const useWebSocket = (roomId: string) => {
  const { user } = useProfile();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  // Function to handle user joining
  const handleUserJoin = (userId: string) => {
    console.log('User joined:', userId);
    setConnectedUsers(prev => {
      // Don't add if already in the list
      if (prev.find(u => u.id === userId)) {
        console.log('User already in list:', userId);
        return prev;
      }
      console.log('Adding user to list:', userId);
      return [...prev, { id: userId, joinedAt: new Date() }];
    });
  };

  // Function to handle user leaving
  const handleUserLeave = (userId: string) => {
    console.log('User left:', userId);
    setConnectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  useEffect(() => {
    if (!roomId || !user?.id) return;

    const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${user.id}`;
    console.log('Connecting to WebSocket:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setError(null);
      // Add self to connected users when connection established
      handleUserJoin(user.id);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setConnectedUsers([]); // Clear connected users on disconnect
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('Failed to connect to chat server');
    };

    ws.current.onmessage = (event) => {
      try {
        const text = event.data;
        console.log('WebSocket message received:', text);

        // Handle initial users list
        if (text.startsWith('[USERS]')) {
          const usersMatch = text.match(/\[USERS\] (.*)/);
          if (usersMatch) {
            const userIds: string[] = usersMatch[1].split(',').map((id: string) => id.trim());
            console.log('Initial users list:', userIds);
            setConnectedUsers(userIds.map((id: string) => ({
              id,
              joinedAt: new Date()
            })));
            return;
          }
        }

        // Handle JOIN messages
        if (text.includes('[JOIN]')) {
          const joinMatch = text.match(/\[JOIN\] (.*?) joined/);
          if (joinMatch) {
            const joinedUserId = joinMatch[1];
            handleUserJoin(joinedUserId);
            setMessages(prev => [...prev, {
              text: `${joinedUserId} joined the room`,
              senderId: joinedUserId,
              type: 'join'
            }]);
          }
          return;
        }

        // Handle LEAVE messages
        if (text.includes('[LEAVE]')) {
          const leaveMatch = text.match(/\[LEAVE\] (.*?) left/);
          if (leaveMatch) {
            const leftUserId = leaveMatch[1];
            handleUserLeave(leftUserId);
            setMessages(prev => [...prev, {
              text: `${leftUserId} left the room`,
              senderId: leftUserId,
              type: 'leave'
            }]);
          }
          return;
        }

        // Handle BROADCAST messages
        if (text.includes('[BROADCAST]')) {
          const broadcastMatch = text.match(/Message from (.*?) in room .*?: (.*)/);
          if (broadcastMatch) {
            const [, senderId, message] = broadcastMatch;
            // Ensure sender is in connected users list
            handleUserJoin(senderId);
            setMessages(prev => [...prev, {
              text: message,
              senderId: senderId,
              type: 'message'
            }]);
          }
          return;
        }

        // Handle other messages (fallback)
        const [senderId, messageText] = text.split(':');
        if (senderId && messageText) {
          // Ensure sender is in connected users list
          handleUserJoin(senderId);
          setMessages(prev => [...prev, {
            text: messageText,
            senderId: senderId,
            type: 'message'
          }]);
        }
      } catch (err) {
        console.error('Error handling message:', err, event.data);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId, user?.id]);

  const sendMessage = (text: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to chat server');
      return;
    }

    setMessages(prev => [...prev, {
      text: text,
      senderId: user?.id || '',
      type: 'message'
    }]);

    ws.current.send(`${text}`);
  };

  return {
    isConnected,
    error,
    sendMessage,
    messages,
    connectedUsers,
    connectedCount: connectedUsers.length,
    ws: ws.current,
  };
}; 