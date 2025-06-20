import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useWebSocket } from './useWebSocket';
import { useTypingIndicator } from './useTypingIndicator';
import { useMessageGrouping } from './useMessageGrouping';
import useProfile from '@/hooks/useProfile';

import { ChatRoom, Message } from '../types/chatTypes';
import { 
  MAX_MESSAGE_LENGTH, 
  SCROLL_DELAY,
  ERROR_MESSAGES,
} from '../constants/chatConstants';
import { 
  triggerHapticFeedback, 
  triggerSuccessHaptic,
  createTempMessage,
  createFileMessage,
} from '../utils/messageHandlers';
import { API_BASE_URL } from '../config/chatConfig';
import chatService, { RoomMembersResponse } from '../services/chatService';

// WebSocket constants
const WS_OPEN = 1;

// State interfaces for better organization
interface ChatState {
  room: ChatRoom | null;
  isMember: boolean;
  messageText: string;
  loading: boolean;
  error: string | null;
  joining: boolean;
}

interface UIState {
  showEmojiPicker: boolean;
  isRoomInfoVisible: boolean;
  showStickerPicker: boolean;
}

interface ReplyState {
  replyTo: Message | undefined;
}

interface RoomDataState {
  roomMembers: RoomMembersResponse | null;
  loadingMembers: boolean;
}

export const useChatRoom = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useProfile();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const userId = user?.data[0]._id || '';
  const roomId = params.roomId as string;

  // Consolidated state management
  const [chatState, setChatState] = useState<ChatState>({
    room: null,
    isMember: false,
    messageText: '',
    loading: true,
    error: null,
    joining: false,
  });

  const [uiState, setUIState] = useState<UIState>({
    showEmojiPicker: false,
    isRoomInfoVisible: false,
    showStickerPicker: false,
  });

  const [replyState, setReplyState] = useState<ReplyState>({
    replyTo: undefined,
  });

  const [roomDataState, setRoomDataState] = useState<RoomDataState>({
    roomMembers: null,
    loadingMembers: false,
  });

  // Track initialization state to prevent multiple calls
  const isInitialized = useRef(false);
  const initializationInProgress = useRef(false);

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

  // State update helpers
  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateReplyState = useCallback((updates: Partial<ReplyState>) => {
    setReplyState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateRoomDataState = useCallback((updates: Partial<RoomDataState>) => {
    setRoomDataState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize room data - only once
  const initializeRoom = useCallback(async () => {
    if (isInitialized.current || initializationInProgress.current) {
      console.log('Room already initialized or initialization in progress, skipping...');
      return;
    }

    try {
      initializationInProgress.current = true;
      updateChatState({ loading: true });
      console.log('Initializing room data...');
      
      if (params.room) {
        const roomData = JSON.parse(params.room as string);
        updateChatState({ 
          room: roomData, 
          isMember: roomData.is_member || false 
        });
        console.log('Room data loaded from params, is_member:', roomData.is_member);
      } else {
        const roomData = await chatService.getRoom(roomId);
        if (!roomData) throw new Error('Room not found');
        
        updateChatState({ 
          room: roomData, 
          isMember: roomData.is_member || false 
        });
        console.log('Room data loaded from API, is_member:', roomData.is_member);
      }
      
      // Fetch room members
      await fetchRoomMembers();
      
      isInitialized.current = true;
    } catch (err) {
      console.error('Error initializing room:', err);
      updateChatState({ error: 'Failed to load room' });
    } finally {
      updateChatState({ loading: false });
      initializationInProgress.current = false;
    }
  }, [roomId, params.room, updateChatState]);

  // Fetch room members
  const fetchRoomMembers = useCallback(async () => {
    try {
      updateRoomDataState({ loadingMembers: true });
      const members = await chatService.getRoomMembers(roomId);
      updateRoomDataState({ roomMembers: members });
      console.log('Room members loaded:', members);
    } catch (error) {
      console.error('Error fetching room members:', error);
    } finally {
      updateRoomDataState({ loadingMembers: false });
    }
  }, [roomId, updateRoomDataState]);

  // Connect to WebSocket only when room is initialized and user is a member
  const connectToWebSocket = useCallback(async () => {
    if (!isInitialized.current || !chatState.room?.is_member) {
      console.log('Cannot connect: room not initialized or user not a member', {
        isInitialized: isInitialized.current,
        isMember: chatState.room?.is_member
      });
      return;
    }

    if (isConnected) {
      console.log('WebSocket already connected, skipping connection...');
      return;
    }

    console.log('Connecting to WebSocket...');
    await wsConnect(roomId);
  }, [chatState.room?.is_member, isConnected, wsConnect, roomId]);

  // Initialize room on mount - only once
  useEffect(() => {
    const setup = async () => {
      // Reset initialization state when roomId changes
      isInitialized.current = false;
      initializationInProgress.current = false;
      
      // Reset state when room changes
      updateChatState({
        room: null,
        isMember: false,
        error: null,
        loading: true,
      });
      updateRoomDataState({ roomMembers: null });
      
      // Disconnect from previous WebSocket
      if (ws && ws.readyState === WS_OPEN) {
        console.log('Disconnecting from previous WebSocket...');
        ws.close();
      }
      
      // Call disconnect to clean up WebSocket state
      wsDisconnect();
      
      await initializeRoom();
    };

    setup();

    return () => {
      if (ws && ws.readyState === WS_OPEN) ws.close();
      wsDisconnect();
    };
  }, [roomId]); // Add roomId as dependency to reinitialize when room changes

  // Connect to WebSocket when room is ready and user is a member
  useEffect(() => {
    if (isInitialized.current && chatState.room?.is_member && !isConnected) {
      connectToWebSocket();
    }
  }, [isInitialized.current, chatState.room?.is_member, isConnected, connectToWebSocket]);

  const handleJoin = async () => {
    try {
      if (!chatState.room || chatState.room.is_member || chatState.joining) return;
      updateChatState({ joining: true });

      const result = await chatService.joinRoom(roomId);
      
      if (result.success && result.room) {
        updateChatState({
          room: result.room,
          isMember: true,
        });
        
        // Refresh room members after joining
        await fetchRoomMembers();
        
        // Connect to WebSocket after joining
        await connectToWebSocket();
        
        triggerSuccessHaptic();
      } else {
        throw new Error(result.message || ERROR_MESSAGES.JOIN_FAILED);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      updateChatState({ error: ERROR_MESSAGES.JOIN_FAILED });
    } finally {
      updateChatState({ joining: false });
    }
  };

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = chatState.messageText.trim();
    if (!trimmedMessage || !chatState.room?.is_member || !isConnected) return;
    // ป้องกัน reply ที่ id ไม่ถูกต้อง
    if (replyState.replyTo && (
      !replyState.replyTo.id ||
      replyState.replyTo.id.startsWith('msg-') ||
      replyState.replyTo.id.length !== 24
    )) {
      alert('ไม่สามารถ reply ข้อความนี้ได้ กรุณารอให้ข้อความถูกส่งสำเร็จก่อน');
      return;
    }
    
    try {
      const tempMessage = createTempMessage(trimmedMessage, userId, replyState.replyTo);
      addMessage(tempMessage);
      
      // Debug log
      console.log('handleSendMessage: replyTo =', replyState.replyTo);
      // Send message with /reply <messageID> <ข้อความ> if replyTo exists
      let messageToSend = trimmedMessage;
      if (replyState.replyTo && replyState.replyTo.id) {
        messageToSend = `/reply ${replyState.replyTo.id} ${trimmedMessage}`;
      }
      console.log('handleSendMessage: messageToSend =', messageToSend);
      
      wsSendMessage(messageToSend);
      updateChatState({ messageText: '' });
      updateReplyState({ replyTo: undefined });
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending message:', error);
      updateChatState({ error: ERROR_MESSAGES.SEND_FAILED });
    }
  }, [chatState.messageText, chatState.room, isConnected, wsSendMessage, userId, addMessage, replyState.replyTo, updateChatState, updateReplyState]);

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

        const response = await fetch(`${API_BASE_URL}/rooms/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed with status:', response.status, 'Error:', errorText);
          throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const tempMessage = createFileMessage(data);
        addMessage(tempMessage);
        
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to upload image: ${errorMessage}`);
    }
  }, [roomId, userId, addMessage]);

  const handleSendSticker = useCallback(async (stickerId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rooms/${roomId}/stickers?userId=${userId}&stickerId=${stickerId}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to send sticker');

      const data = await response.json();
      
      // Add the sticker message to WebSocket state
      const stickerMessage: Message = {
        id: data.id || Date.now().toString(),
        senderId: data.user_id,
        senderName: typeof user?.data[0].name === 'string' 
          ? user?.data[0].name 
          : `${user?.data[0].name?.first || ''} ${user?.data[0].name?.last || ''}`.trim(),
        type: 'sticker',
        timestamp: data.timestamp || new Date().toISOString(),
        isRead: false,
        stickerId: data.stickerId || stickerId,
        image: data.image,
        username: data.username || data.user_id || '',
        isTemp: false
      };
      
      addMessage(stickerMessage);
      updateUIState({ showStickerPicker: false });
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending sticker:', error);
      Alert.alert('Error', 'Failed to send sticker');
    }
  }, [roomId, userId, addMessage, user?.data[0].name, updateUIState]);

  // Expose state and handlers
  return {
    // Chat state
    room: chatState.room,
    isMember: chatState.isMember,
    messageText: chatState.messageText,
    loading: chatState.loading,
    error: chatState.error,
    joining: chatState.joining,
    
    // UI state
    showEmojiPicker: uiState.showEmojiPicker,
    isRoomInfoVisible: uiState.isRoomInfoVisible,
    showStickerPicker: uiState.showStickerPicker,
    
    // Reply state
    replyTo: replyState.replyTo,
    
    // Room data state
    roomMembers: roomDataState.roomMembers,
    loadingMembers: roomDataState.loadingMembers,
    
    // WebSocket state
    isConnected,
    wsError,
    connectedUsers,
    typing,
    
    // Refs
    flatListRef,
    inputRef,
    userId,
    groupMessages,
    
    // State setters
    setMessageText: (text: string) => updateChatState({ messageText: text }),
    setShowEmojiPicker: (show: boolean) => updateUIState({ showEmojiPicker: show }),
    setIsRoomInfoVisible: (visible: boolean) => updateUIState({ isRoomInfoVisible: visible }),
    setReplyTo: (message: Message | undefined) => updateReplyState({ replyTo: message }),
    setShowStickerPicker: (show: boolean) => updateUIState({ showStickerPicker: show }),
    
    // Handlers
    fetchRoomMembers,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTyping,
    initializeRoom,
  };
};

export default useChatRoom; 