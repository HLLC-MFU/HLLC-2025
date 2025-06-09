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
import { API_BASE_URL } from '../config/chatConfig';

interface ChatRoomState {
  room: ChatRoom | null;
  isMember: boolean;
  messageText: string;
  loading: boolean;
  error: string | null;
  joining: boolean;
  showEmojiPicker: boolean;
  isRoomInfoVisible: boolean;
  replyTo: Message | undefined;
  showStickerPicker: boolean;
}

interface ChatRoomHook {
  room: ChatRoom | null;
  isMember: boolean;
  messageText: string;
  loading: boolean;
  error: string | null;
  joining: boolean;
  showEmojiPicker: boolean;
  isRoomInfoVisible: boolean;
  replyTo: Message | undefined;
  showStickerPicker: boolean;
  isConnected: boolean;
  wsError: string | null;
  connectedUsers: ConnectedUser[];
  typing: { id: string; name?: string }[];
  flatListRef: React.RefObject<any>;
  inputRef: React.RefObject<any>;
  userId: string;
  groupMessages: () => Message[][];
  handleJoin: () => Promise<void>;
  handleSendMessage: () => Promise<void>;
  handleImageUpload: () => Promise<void>;
  handleSendSticker: (stickerId: string) => Promise<void>;
  handleTyping: () => void;
  initializeRoom: () => Promise<void>;
  setMessageText: (text: string) => void;
  setReplyTo: (reply: Message | undefined) => void;
  setIsRoomInfoVisible: (visible: boolean) => void;
  setShowStickerPicker: (show: boolean) => void;
  setShowEmojiPicker: (show: boolean) => void;
}

export const useChatRoom = (): ChatRoomHook => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useProfile();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const userId = user?.data[0]._id || '';
  const roomId = params.roomId as string;

  const [state, setState] = useState<ChatRoomState>({
    room: null,
    isMember: false,
    messageText: '',
    loading: true,
    error: null,
    joining: false,
    showEmojiPicker: false,
    isRoomInfoVisible: false,
    replyTo: undefined,
    showStickerPicker: false
  });

  const updateState = useCallback((updates: Partial<ChatRoomState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

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
    addMessage,
    handleTyping
  } = useWebSocket(roomId);

  const { isTyping, handleTyping: typingIndicatorHandleTyping } = useTypingIndicator();
  const groupMessages = useMessageGrouping(wsMessages);

  // Initialize room data
  const initializeRoom = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      let roomData;
      if (params.room) {
        roomData = JSON.parse(params.room as string);
      } else {
        const roomWithMembers = await chatService.getRoomWithMembers(roomId);
        if (!roomWithMembers) {
          throw new Error('Room not found');
        }
        
        roomData = roomWithMembers.room;
        const isUserMember = roomWithMembers.members.some(
          (member: any) => member.user_id === userId
        );

        console.log('Room initialization:', {
          roomData,
          roomWithMembers,
          userId,
          isUserMember
        });

        updateState({ 
          room: {
            ...roomData,
            is_member: isUserMember,
            members: roomWithMembers.members
          },
          isMember: isUserMember
        });
        
        if (isUserMember && (!ws || ws.readyState !== WebSocket.OPEN)) {
          await wsConnect(roomId);
        }
      }
    } catch (err) {
      console.error('Error initializing room:', err);
      updateState({ error: 'Failed to load room' });
    } finally {
      updateState({ loading: false });
    }
  }, [roomId, params.room, wsConnect, ws, userId, updateState]);

  // Heartbeat mechanism
  const startHeartbeat = useCallback(() => {
    const heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        } catch (err) {
          console.error('Error sending heartbeat:', err);
          clearInterval(heartbeatInterval);
          if (state.room?.is_member) wsConnect(roomId);
        }
      } else {
        clearInterval(heartbeatInterval);
        if (state.room?.is_member) wsConnect(roomId);
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(heartbeatInterval);
  }, [ws, state.room?.is_member, roomId, wsConnect]);

  // Initialize room on mount
  useEffect(() => {
    let heartbeatCleanup: (() => void) | undefined;
    
    const setup = async () => {
      await initializeRoom();
      if (state.room?.is_member) {
        heartbeatCleanup = startHeartbeat();
      }
    };

    setup();

    return () => {
      if (heartbeatCleanup) heartbeatCleanup();
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [initializeRoom, startHeartbeat, ws]);

  // Handle WebSocket disconnection
  useEffect(() => {
    if (!ws) return;

    const handleDisconnect = () => {
      if (state.room?.is_member) {
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
  }, [ws, state.room?.is_member, roomId, wsConnect]);

  const handleJoin = async () => {
    try {
      if (!state.room || state.joining) return;
      
      // Double check membership status
      const roomWithMembers = await chatService.getRoomWithMembers(roomId);
      if (!roomWithMembers) {
        throw new Error('Failed to get room data');
      }

      const isUserMember = roomWithMembers.members.some(
        (member: any) => member.user_id === userId
      );

      if (isUserMember) {
        updateState({ 
          room: { 
            ...state.room, 
            is_member: true,
            members: roomWithMembers.members
          },
          isMember: true
        });
        
        if (ws) ws.close();
        await wsConnect(roomId);
        return;
      }

      updateState({ joining: true });
      const result = await chatService.joinRoom(roomId);
      
      if (result.success && result.room) {
        // Get updated room data with members
        const updatedRoomWithMembers = await chatService.getRoomWithMembers(roomId);
        if (!updatedRoomWithMembers) {
          throw new Error('Failed to get updated room data');
        }
        
        updateState({ 
          room: { 
            ...result.room, 
            is_member: true,
            members: updatedRoomWithMembers.members
          },
          isMember: true
        });
        
        if (ws) ws.close();
        await wsConnect(roomId);
        
        triggerSuccessHaptic();
      } else {
        throw new Error(result.message || ERROR_MESSAGES.JOIN_FAILED);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      updateState({ error: ERROR_MESSAGES.JOIN_FAILED });
    } finally {
      updateState({ joining: false });
    }
  };

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = state.messageText.trim();
    if (!trimmedMessage || !state.room?.is_member || !isConnected) return;
    
    try {
      const tempMessage = createTempMessage(trimmedMessage, userId, state.replyTo);
      addMessage(tempMessage);
      
      const messageData = {
        eventType: 'message',
        payload: {
          message: trimmedMessage,
          userId: userId,
          replyTo: state.replyTo ? {
            id: state.replyTo.id || '',
            text: state.replyTo.text || '',
            senderId: state.replyTo.senderId,
            senderName: state.replyTo.senderName
          } : undefined
        }
      };
      
      wsSendMessage(JSON.stringify(messageData));
      updateState({ 
        messageText: '',
        replyTo: undefined
      });
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending message:', error);
      updateState({ error: ERROR_MESSAGES.SEND_FAILED });
    }
  }, [state.messageText, state.room, state.replyTo, isConnected, wsSendMessage, userId, addMessage, updateState]);

  const handleImageUpload = useCallback(async () => {
    try {
      if (!state.room?.is_member || !isConnected) {
        Alert.alert('Error', 'ไม่สามารถอัพโหลดรูปภาพได้');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
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

        // Show loading state
        updateState({ loading: true });

        const response = await fetch(`${API_BASE_URL}/rooms/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.ok) {
          throw new Error('ไม่สามารถอัพโหลดรูปภาพได้');
        }

        const data = await response.json();

        // Send image message through WebSocket
        const messageData = {
          eventType: 'image',
          payload: {
            imageUrl: data.imageUrl,
            fileName: data.fileName,
            fileType: data.fileType,
            userId: userId,
            roomId: roomId
          }
        };

        wsSendMessage(JSON.stringify(messageData));

        // Create temporary message for immediate display
        const tempMessage: Message = {
          id: Date.now().toString(),
          fileUrl: data.imageUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          senderId: userId,
          senderName: user?.data[0].name || '',
          type: 'file',
          timestamp: new Date().toISOString(),
          isRead: false
        };

        addMessage(tempMessage);
        triggerHapticFeedback();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'ไม่สามารถอัพโหลดรูปภาพได้');
    } finally {
      updateState({ loading: false });
    }
  }, [roomId, userId, state.room?.is_member, isConnected, wsSendMessage, addMessage, user?.data[0].name, updateState]);

  const handleSendSticker = useCallback(async (stickerId: string) => {
    try {
      if (!state.room?.is_member || !isConnected) {
        Alert.alert('Error', 'ไม่สามารถส่งสติกเกอร์ได้');
        return;
      }

      const messageData = {
        eventType: 'sticker',
        payload: {
          stickerId,
          userId: userId,
          roomId: roomId
        }
      };

      // Send sticker message through WebSocket
      wsSendMessage(JSON.stringify(messageData));

      // Create temporary message for immediate display
      const tempMessage: Message = {
        id: Date.now().toString(),
        stickerId,
        senderId: userId,
        senderName: user?.data[0].name || '',
        type: 'sticker',
        timestamp: new Date().toISOString(),
        isRead: false
      };

      addMessage(tempMessage);
      updateState({ showStickerPicker: false });
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending sticker:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'ไม่สามารถส่งสติกเกอร์ได้');
    }
  }, [roomId, userId, state.room?.is_member, isConnected, wsSendMessage, addMessage, user?.data[0].name, updateState]);

  return {
    ...state,
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
    setMessageText: (text: string) => updateState({ messageText: text }),
    setReplyTo: (reply: Message | undefined) => updateState({ replyTo: reply }),
    setIsRoomInfoVisible: (visible: boolean) => updateState({ isRoomInfoVisible: visible }),
    setShowStickerPicker: (show: boolean) => updateState({ showStickerPicker: show }),
    setShowEmojiPicker: (show: boolean) => updateState({ showEmojiPicker: show })
  };
}; 