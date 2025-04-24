import { useEffect, useRef, useState } from 'react';
import useProfile from '@/hooks/useProfile';

interface Message {
  text: string;
  senderId: string;
  type: 'message' | 'join' | 'leave';
}

export const useWebSocket = (roomId: string) => {
  const { user } = useProfile();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!roomId || !user?.id) return;

    const wsUrl = `ws://localhost:1334/ws/${roomId}/${user.id}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setError(null);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('Failed to connect to chat server');
    };

    ws.current.onmessage = (event) => {
      try {
        // Handle plain text message
        const text = event.data;
        const [senderId, messageText] = text.split(':');
        
        if (text.includes('joined')) {
          setMessages(prev => [...prev, {
            text: messageText,
            senderId: senderId,
            type: 'join'
          }]);
        } else if (text.includes('left')) {
          setMessages(prev => [...prev, {
            text: messageText,
            senderId: senderId,
            type: 'leave'
          }]);
        } else {
          setMessages(prev => [...prev, {
            text: messageText,
            senderId: senderId,
            type: 'message'
          }]);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
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

    // Add message to local state immediately
    setMessages(prev => [...prev, {
      text: text,
      senderId: user?.id || '',
      type: 'message'
    }]);

    // Send message with user ID prefix
    ws.current.send(`${text}`);
  };

  return {
    isConnected,
    error,
    sendMessage,
    messages,
    ws: ws.current,
  };
}; 