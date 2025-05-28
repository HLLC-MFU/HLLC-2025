import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import WebSocket from 'react';
import * as ImagePicker from 'expo-image-picker';

import { useWebSocket } from './useWebSocket';
import { useTypingIndicator } from './useTypingIndicator';
import { useMessageGrouping } from './useMessageGrouping';
import useProfile from '@/hooks/useProfile';
import { chatService } from '../services/chatService';
import { ChatRoom, Message } from '../types/chatTypes';
import { 
  MAX_MESSAGE_LENGTH, 
  SCROLL_DELAY,
  ERROR_MESSAGES,
  HEARTBEAT_INTERVAL,
} from '../constants/chatConstants';
import { 
  triggerHapticFeedback, 
  triggerSuccessHaptic,
  createTempMessage,
  createFileMessage,
} from '../utils/messageHandlers';
import { handleWebSocketMessage } from '../utils/websocketHandlers';

export const useChatRoom = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useProfile();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const userId = user?._id || '';
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRoomInfoVisible, setIsRoomInfoVisible] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | undefined>(undefined);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const {
    isConnected,
    error: wsError,
    sendMessage: wsSendMessage,
    messages: wsMessages,
    connectedUsers,
    typing,
    connect: wsConnect,
    disconnect: wsDisconnect,
    ws,
    addMessage
  } = useWebSocket(roomId);

  const { isTyping, handleTyping } = useTypingIndicator();
  const groupMessages = useMessageGrouping(wsMessages);

  // Initialize room data
  const initializeRoom = useCallback(async () => {
    try {
      setLoading(true);
      if (params.room) {
        const roomData = JSON.parse(params.room as string);
        setRoom(roomData);
        setIsMember(roomData.is_member || false);
        
        if (roomData.is_member && (!ws || ws.readyState !== WebSocket.OPEN)) {
          await wsConnect(roomId);
          startHeartbeat();
        }
      } else {
        const roomData = await chatService.getRoom(roomId);
        if (!roomData) throw new Error('Room not found');
        
        setRoom(roomData);
        setIsMember(roomData.is_member || false);
        
        if (roomData.is_member && (!ws || ws.readyState !== WebSocket.OPEN)) {
          await wsConnect(roomId);
          startHeartbeat();
        }
      }
    } catch (err) {
      console.error('Error initializing room:', err);
      setError('Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [roomId, params.room, wsConnect, ws]);

  // Heartbeat mechanism
  const startHeartbeat = useCallback(() => {
    const heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        } catch (err) {
          console.error('Error sending heartbeat:', err);
          clearInterval(heartbeatInterval);
          if (room?.is_member) wsConnect(roomId);
        }
      } else {
        clearInterval(heartbeatInterval);
        if (room?.is_member) wsConnect(roomId);
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(heartbeatInterval);
  }, [ws, room?.is_member, roomId, wsConnect]);

  // Initialize room on mount
  useEffect(() => {
    let heartbeatCleanup: (() => void) | undefined;
    
    const setup = async () => {
      await initializeRoom();
      if (room?.is_member) {
        heartbeatCleanup = startHeartbeat();
      }
    };

    setup();

    return () => {
      if (heartbeatCleanup) heartbeatCleanup();
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [initializeRoom, startHeartbeat, room?.is_member]);

  // Handle WebSocket disconnection
  useEffect(() => {
    if (!ws) return;

    const handleDisconnect = () => {
      if (room?.is_member) {
        console.log('WebSocket disconnected, attempting to reconnect...');
        wsConnect(roomId);
      }
    };

    ws.addEventListener('close', handleDisconnect);
    ws.addEventListener('error', handleDisconnect);

    return () => {
      ws.removeEventListener('close', handleDisconnect);
      ws.removeEventListener('error', handleDisconnect);
    };
  }, [ws, room?.is_member, roomId, wsConnect]);

  const handleJoin = async () => {
    try {
      if (!room || room.is_member || joining) return;
      setJoining(true);

      const result = await chatService.joinRoom(roomId);
      
      if (result.success && result.room) {
        setRoom(result.room);
        setIsMember(true);
        
        if (ws) ws.close();
        await wsConnect(roomId);
        
        triggerSuccessHaptic();
      } else {
        throw new Error(result.message || ERROR_MESSAGES.JOIN_FAILED);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError(ERROR_MESSAGES.JOIN_FAILED);
    } finally {
      setJoining(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !room?.is_member || !isConnected) return;
    
    try {
      const tempMessage = createTempMessage(trimmedMessage, userId, replyTo);
      addMessage(tempMessage);
      
      const messageData = {
        eventType: 'message',
        payload: {
          message: trimmedMessage,
          userId: userId,
          replyTo: replyTo ? {
            id: replyTo.id || '',
            text: replyTo.text || '',
            senderId: replyTo.senderId,
            senderName: replyTo.senderName
          } : undefined
        }
      };
      
      wsSendMessage(JSON.stringify(messageData));
      setMessageText('');
      setReplyTo(undefined);
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(ERROR_MESSAGES.SEND_FAILED);
    }
  }, [messageText, room, isConnected, wsSendMessage, userId, addMessage, replyTo]);

  const handleImageUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const formData = new FormData();
        const file = {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'image/jpeg',
          name: result.assets[0].fileName || 'image.jpg',
        };

        formData.append('file', file as any);
        formData.append('roomId', roomId);
        formData.append('userId', userId);

        const response = await fetch(`http://localhost:1334/api/v1/rooms/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.ok) throw new Error('Failed to upload image');

        const data = await response.json();
        const tempMessage = createFileMessage(data);
        addMessage(tempMessage);
        
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  }, [roomId, userId, addMessage]);

  const handleSendSticker = useCallback(async (stickerId: string) => {
    try {
      const response = await fetch(
        `http://localhost:1334/api/v1/rooms/${roomId}/stickers?userId=${userId}&stickerId=${stickerId}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to send sticker');

      setShowStickerPicker(false);
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending sticker:', error);
      Alert.alert('Error', 'Failed to send sticker');
    }
  }, [roomId, userId]);

  return {
    room,
    isMember,
    messageText,
    setMessageText,
    loading,
    error,
    joining,
    showEmojiPicker,
    setShowEmojiPicker,
    isRoomInfoVisible,
    setIsRoomInfoVisible,
    replyTo,
    setReplyTo,
    showStickerPicker,
    setShowStickerPicker,
    isConnected,
    wsError,
    connectedUsers,
    typing,
    flatListRef,
    inputRef,
    userId,
    groupMessages,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTyping,
    initializeRoom,
  };
}; 