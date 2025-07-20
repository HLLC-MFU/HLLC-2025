import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useWebSocket } from './useWebSocket';
import { useMessageGrouping } from './useMessageGrouping';
import useProfile from '@/hooks/useProfile';
import { ChatRoom, Message } from '@/types/chatTypes';
import type { RoomMember } from '@/types/chatTypes';
import { createFileMessage, createTempMessage, triggerHapticFeedback, triggerSuccessHaptic } from '@/utils/chats/messageHandlers';
import { ERROR_MESSAGES } from '@/constants/chats/chatConstants';
import { CHAT_BASE_URL, API_BASE_URL } from '@/configs/chats/chatConfig';
import chatService from '@/services/chats/chatService';
import { getToken } from '@/utils/storage';



// WebSocket constants
const WS_OPEN = 1;

// State interfaces for better organization
interface ChatState {
  room: ChatRoom | null;
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

interface MentionState {
  mentionSuggestions: RoomMember[];
  mentionQuery: string;
  isMentioning: boolean;
}

interface ReplyState {
  replyTo: Message | undefined;
}

// เพิ่ม state สำหรับ paginated members
interface MembersState {
  members: RoomMember[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  hasMore: boolean;
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

  const [mentionState, setMentionState] = useState<MentionState>({
    mentionSuggestions: [],
    mentionQuery: '',
    isMentioning: false,
  });

  const [replyState, setReplyState] = useState<ReplyState>({
    replyTo: undefined,
  });

  // เพิ่ม state สำหรับ paginated members
  const [membersState, setMembersState] = useState<MembersState>({
    members: [],
    total: 0,
    page: 1,
    limit: 50,
    loading: false,
    hasMore: true,
  });

  // Track initialization state to prevent multiple calls
  const isInitialized = useRef(false);
  const initializationInProgress = useRef(false);
  const membersLoaded = useRef(false); // เพิ่ม ref เพื่อ track ว่าโหลดสมาชิกแล้วหรือยัง

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

  const groupMessages = useMessageGrouping(wsMessages);

  // State update helpers
  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateMentionState = useCallback((updates: Partial<MentionState>) => {
    setMentionState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateReplyState = useCallback((updates: Partial<ReplyState>) => {
    setReplyState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle text input changes for mentions
  const handleTextInput = (text: string) => {
    updateChatState({ messageText: text });

    // Regex to find @ at the end of the string, or after a space
    const mentionMatch = text.match(/(?:^|\s)@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      updateMentionState({ isMentioning: true, mentionQuery: query });

      // ตรวจสอบ mention all
      if (query === 'all' || query === 'ทุกคน') {
        // สร้าง special suggestion สำหรับ mention all
        const mentionAllSuggestion = {
          user_id: 'all',
          user: {
            _id: 'all',
            name: { first: '', middle: '', last: '' },
            username: 'all',
            profile_image_url: ''
          }
        };
        updateMentionState({ mentionSuggestions: [mentionAllSuggestion] });
        return;
      }

      // ใช้ membersState.members ทั้งหมดในการ filter
      const filteredMembers = membersState.members.filter(member => {
        const fullName = `${member.user.name.first} ${member.user.name.last}`.toLowerCase();
        return (
          fullName.includes(query) ||
          member.user.username.toLowerCase().includes(query)
        );
      });
      updateMentionState({ mentionSuggestions: filteredMembers });
    } else {
      updateMentionState({ isMentioning: false, mentionSuggestions: [] });
    }
  };

  // Handle selecting a user from mention suggestions
  const handleMentionSelect = (user: RoomMember) => {
    const currentText = chatState.messageText;
    const mentionMatch = currentText.match(/(?:^|\s)@\w*$/);
    if (mentionMatch && typeof mentionMatch.index === 'number') {
      const mentionText = user.user_id === 'all' ? '@all' : `@${user.user.username}`;
      const newText = currentText.substring(0, mentionMatch.index) + `${mentionMatch.index > 0 ? ' ' : ''}${mentionText} `;
      updateChatState({ messageText: newText });
    }
    updateMentionState({ isMentioning: false, mentionSuggestions: [] });
    if (inputRef.current) {
      // @ts-ignore
      inputRef.current.focus();
    }
  };

  // Initialize room data - only once
  const initializeRoom = useCallback(async () => {
    if (isInitialized.current || initializationInProgress.current) {
      return;
    }

    try {
      initializationInProgress.current = true;
      updateChatState({ loading: true });

      let roomData;
      if (params.room) {
        roomData = JSON.parse(params.room as string);
        if (roomData.is_member === undefined && params.isMember === 'true') {
          roomData.is_member = true;
        }
        console.log('[DEBUG] useChatRoom roomData', roomData);
      } else {
        roomData = await chatService.getRoom(roomId);
        if (!roomData) throw new Error('Room not found');
        console.log('[DEBUG] useChatRoom roomData (from API)', roomData);
      }
      updateChatState({
        room: roomData
      });
      isInitialized.current = true;
    } catch (err) {
      console.error('Error initializing room:', err);
      updateChatState({ error: 'Failed to load room' });
    } finally {
      updateChatState({ loading: false });
      initializationInProgress.current = false;
    }
  }, [roomId, params.room, params.isMember, updateChatState]);

  // Connect to WebSocket only when room is initialized and user is a member
  const connectToWebSocket = useCallback(async () => {
    // ใช้ is_member จาก backend แทนการเช็คจาก members array
    const isMember = !!(chatState.room && chatState.room.is_member);
    if (!isInitialized.current || !isMember) {
      console.log('Cannot connect: room not initialized or user not a member', {
        isInitialized: isInitialized.current,
        isMember
      });
      return;
    }

    if (isConnected) {
      console.log('WebSocket already connected, skipping connection...');
      return;
    }

    console.log('Connecting to WebSocket...');
    await wsConnect(roomId);
  }, [chatState.room, isConnected, wsConnect, roomId]);

  // Initialize room on mount - only once
  useEffect(() => {
    const setup = async () => {
      // Reset initialization state when roomId changes
      isInitialized.current = false;
      initializationInProgress.current = false;
      membersLoaded.current = false; // reset members loaded state

      // Reset state when room changes
      updateChatState({
        room: null,
        error: null,
        loading: true,
      });

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
    // ใช้ is_member จาก backend แทนการเช็คจาก members array
    const isMember = !!(chatState.room && chatState.room.is_member);
    if (isInitialized.current && isMember && !isConnected) {
      connectToWebSocket();
    }
  }, [roomId, userId, chatState.room, isConnected]);

  const handleJoin = async () => {
    try {
      // ใช้ is_member จาก backend แทนการเช็คจาก members array
      const isMember = !!(chatState.room && chatState.room.is_member);
      if (!chatState.room || isMember || chatState.joining) return;
      updateChatState({ joining: true });

      const result = await chatService.joinRoom(roomId);

      if (result.success && result.room) {
        updateChatState({
          room: result.room,
        });
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
    // ใช้ is_member จาก backend แทนการเช็คจาก members array
    const isMember = !!(chatState.room && chatState.room.is_member);
    if (!trimmedMessage || !isMember || !isConnected) return;

    try {
      const myUser = user?.data[0] ? {
        _id: user.data[0]._id,
        name: {
          first: user.data[0].name?.first || '',
          middle: user.data[0].name?.middle || '',
          last: user.data[0].name?.last || '',
        },
        username: user.data[0].username || '',
      } : undefined;
      if (!myUser) return;
      const tempMessage = createTempMessage(trimmedMessage, myUser, replyState.replyTo);
      addMessage(tempMessage);

      // Debug log สำหรับ reply
      console.log('[DEBUG] handleSendMessage', {
        messageText: trimmedMessage,
        replyTo: replyState.replyTo?.id,
        replyToId: replyState.replyTo?.id,
      });
      // Send message with /reply <messageID> <ข้อความ> if replyTo exists
      let messageToSend = trimmedMessage;
      if (replyState.replyTo && replyState.replyTo.id) {
        messageToSend = `/reply ${replyState.replyTo.id} ${trimmedMessage}`;
      }
      console.log('[DEBUG] messageToSend', messageToSend);
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
        mediaTypes: ['images'],
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

        // ดึง token แล้วแนบ Authorization header
        const token = await getToken('accessToken');
        const response = await fetch(`${API_BASE_URL}/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed with status:', response.status, 'Error:', errorText);
          throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const myUser = user?.data[0] ? {
          _id: user.data[0]._id,
          name: {
            first: user.data[0].name?.first || '',
            middle: user.data[0].name?.middle || '',
            last: user.data[0].name?.last || '',
          },
          username: user.data[0].username || '',
        } : undefined;
        if (!myUser) return;
        const tempMessage = createFileMessage(data, myUser);
        if (tempMessage) addMessage(tempMessage);

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
      // ดึง token แล้วแนบ Authorization header
      const token = await getToken('accessToken');
      const response = await fetch(
        `${CHAT_BASE_URL}/chat/rooms/${roomId}/stickers`,
        {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, stickerId }),
        }
      );

      if (!response.ok) throw new Error('Failed to send sticker');

      const data = await response.json();

      // Add the sticker message to WebSocket state
      const myUser = user?.data[0] ? {
        _id: user.data[0]._id,
        name: {
          first: user.data[0].name?.first || '',
          middle: user.data[0].name?.middle || '',
          last: user.data[0].name?.last || '',
        },
        username: user.data[0].username || '',
      } : undefined;
      if (!myUser) return;
      const stickerMessage: Message = {
        id: data.id || Date.now().toString(),
        user: myUser,
        type: 'sticker',
        timestamp: data.timestamp || new Date().toISOString(),
        isRead: false,
        isTemp: false,
        stickerId: data.stickerId || stickerId,
        image: data.image,
      };

      addMessage(stickerMessage);
      updateUIState({ showStickerPicker: false });
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending sticker:', error);
      Alert.alert('Error', 'Failed to send sticker');
    }
  }, [roomId, userId, addMessage, user?.data[0].name, updateUIState]);

  // เพิ่ม function สำหรับโหลดรายชื่อสมาชิกแบบ paginated
  const loadMembers = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!roomId || membersState.loading) return;

    // ป้องกันการโหลดซ้ำถ้าโหลดแล้ว (ยกเว้น append)
    if (!append && membersLoaded.current) return;

    try {
      setMembersState(prev => ({ ...prev, loading: true }));

      const result = await chatService.getRoomMembersPaginated(roomId, page, membersState.limit);

      if (result && result.members) {
        setMembersState(prev => ({
          ...prev,
          members: append ? [...prev.members, ...result.members] : result.members,
          total: result.total || 0,
          page: result.page || page,
          hasMore: result.members.length === result.limit,
          loading: false,
        }));
        membersLoaded.current = true; // mark ว่าโหลดแล้ว
      } else {
        // Handle case when result is null or undefined
        setMembersState(prev => ({
          ...prev,
          members: append ? prev.members : [],
          total: 0,
          page: page,
          hasMore: false,
          loading: false,
        }));
        membersLoaded.current = true; // mark ว่าโหลดแล้ว (แม้จะไม่มีข้อมูล)
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setMembersState(prev => ({ ...prev, loading: false }));
    }
  }, [roomId, membersState.limit, membersState.loading]);

  // Load more members
  const loadMoreMembers = useCallback(() => {
    if (membersState.hasMore && !membersState.loading) {
      loadMembers(membersState.page + 1, true);
    }
  }, [membersState.hasMore, membersState.loading, membersState.page, loadMembers]);

  // Handler for unsend message
  const handleUnsendMessage = useCallback(async (message: Message) => {
    try {
      const command = `/unsend ${message.id}`;
      console.log('[Unsend] Sending command:', command);
      wsSendMessage(command);
      console.log('[Unsend] Command sent, performing optimistic update for messageId:', message.id);
      // Remove the message from state (optimistic update)
      addMessage({ ...(message as any), isDeleted: true });
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Unsend ไม่สำเร็จ', (error as Error)?.message || 'เกิดข้อผิดพลาด');
    }
  }, [wsSendMessage, addMessage]);
  const handleDisconnect = () => {
    if (ws) {
      console.log('[ChatRoom] WebSocket status before disconnect:', ws.readyState); // log before

      if (ws.readyState === WS_OPEN) {
        ws.close();
      }

      // Optional: small delay to allow closing before checking final status
      setTimeout(() => {
        console.log('[ChatRoom] WebSocket status after close attempt:', ws.readyState);
      }, 100);
    } else {
      console.log('[ChatRoom] No WebSocket instance found');
    }

    wsDisconnect();
    isInitialized.current = false;
    initializationInProgress.current = false;
    membersLoaded.current = false;

    console.log('[ChatRoom] Manually disconnected WebSocket');
  };


  // Expose state and handlers
  return {
    ...chatState,
    ...uiState,
    ...replyState,
    ...mentionState,
    ...membersState,
    userId,
    roomId,
    isConnected,
    wsError,
    connectedUsers,
    typing,
    inputRef,
    flatListRef,
    groupMessages,
    initializeRoom,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTextInput,
    handleMentionSelect,
    setMessageText: (text: string) => handleTextInput(text),
    setShowEmojiPicker: (show: boolean) => updateUIState({ showEmojiPicker: show }),
    setIsRoomInfoVisible: (show: boolean) => updateUIState({ isRoomInfoVisible: show }),
    setReplyTo: (message?: Message) => updateReplyState({ replyTo: message }),
    setShowStickerPicker: (show: boolean) => updateUIState({ showStickerPicker: show }),
    // เพิ่ม getter isMember
    isMember: (() => {
      const isMember = !!(chatState.room && chatState.room.is_member);
      return isMember;
    })(),
    loadMembers,
    loadMoreMembers,
    handleUnsendMessage,
    handleDisconnect,
  };
}; 