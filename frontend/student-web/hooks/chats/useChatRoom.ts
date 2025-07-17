'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

import { useWebSocket } from './useWebSocket';
import { useTypingIndicator } from './useTypingIndicator';
import { useMessageGrouping } from './useMessageGrouping';
import { useProfile } from '@/hooks/useProfile';
import { ChatRoom, Message } from '@/types/chat';
import type { RoomMember } from '@/types/chat';
import { createTempMessage } from '@/utils/chats/messageHandlers';
import { ERROR_MESSAGES } from '@/constants/chats/chatConstants';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import chatService from '@/services/chats/chatService';
import { getToken } from '@/utils/storage';
import { useParams } from 'next/navigation';



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

interface UseChatRoomReturn {
  room: ChatRoom | null;
  isMember: boolean;
  messageText: string;
  setMessageText: (text: string) => void;
  loading: boolean;
  error: string | null;
  joining: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  isRoomInfoVisible: boolean;
  setIsRoomInfoVisible: (show: boolean) => void;
  replyTo: Message | undefined;
  setReplyTo: (message?: Message) => void;
  showStickerPicker: boolean;
  setShowStickerPicker: (show: boolean) => void;
  isConnected: boolean;
  wsError: Error | null;
  connectedUsers: any[];
  typing: string[];
  inputRef: React.RefObject<HTMLInputElement>;
  userId: string;
  roomId: string;
  groupMessages: any[];
  mentionSuggestions: any[];
  isMentioning: boolean;
  members: any[];
  handleJoin: () => void;
  handleSendMessage: () => void;
  handleImageUpload: (file: File) => void;
  handleSendSticker: (sticker: any) => void;
  handleTyping: () => void;
  handleMentionSelect: (user: any) => void;
  handleTextInput: (text: string) => void;
  initializeRoom: () => void;
  loadMembers: (page: number, append: boolean) => void;
  handleUnsendMessage: (message: Message) => void;
}

interface UseChatRoomProps {
  user: {
    _id: string;
    name?: {
      first?: string;
      middle?: string;
      last?: string;
    };
    username?: string;
  };
}

export const useChatRoom = ({ user }: UseChatRoomProps): UseChatRoomReturn => {
  const params = useParams();
  const flatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = user?._id || '';
  // FIX: use 'id' param for dynamic route
  const roomId = (params.id || params.roomId) as string;

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

  // On mount and after join, fetch /api/rooms/{roomId} and use isMember from response
  const [isMember, setIsMember] = useState(false);

  // Track initialization state to prevent multiple calls
  const isInitialized = useRef(false);
  const initializationInProgress = useRef(false);
  const membersLoaded = useRef(false); // เพิ่ม ref เพื่อ track ว่าโหลดสมาชิกแล้วหรือยัง

  const {
    isConnected,
    connectedUsers,
    typing,
    error: wsError,
    messages: wsMessages,
    sendMessage: wsSendMessage,
    connect: wsConnect,
    disconnect: wsDisconnect,
    ws,
    addMessage
  } = useWebSocket(roomId);

  const { isTyping, handleTyping: originalHandleTyping } = useTypingIndicator();
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
    originalHandleTyping(); // Trigger typing indicator

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
  }, [roomId, params.room, params.isMember, updateChatState, addMessage]);

  // Remove joinedRoomIds logic
  // On mount and after join, fetch /api/rooms/{roomId} and use isMember from response
  const fetchRoomMembership = useCallback(async () => {
    try {
      const token = await getToken('accessToken');
      const res = await fetch(`${CHAT_BASE_URL}/api/rooms/${roomId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch room info');
      const data = await res.json();
      const member = !!(data && data.data && data.data.isMember);
      setIsMember(member);
      console.log('[DEBUG] /api/rooms/{roomId} isMember:', member, 'roomId:', roomId);
    } catch (err) {
      setIsMember(false);
      console.error('[DEBUG] Failed to fetch /api/rooms/{roomId}', err);
    }
  }, [roomId]);

  // Fetch membership on mount and when roomId changes
  useEffect(() => {
    fetchRoomMembership();
  }, [fetchRoomMembership]);

  // Connect to WebSocket as soon as roomId and userId are available and user is a member
  useEffect(() => {
    if (roomId && userId && !isConnected && isMember) {
      wsConnect(roomId);
    }
    // No cleanup needed here; handled by wsDisconnect elsewhere
  }, [roomId, userId, isConnected, wsConnect, isMember]);

  // Debug: log isMember and roomId whenever they change
  useEffect(() => {
    console.log('[DEBUG] isMember:', isMember, 'roomId:', roomId);
  }, [isMember, roomId]);

  // Debug: log wsMessages and groupMessages whenever they change
  useEffect(() => {
    console.log('[DEBUG] wsMessages:', wsMessages);
    console.log('[DEBUG] groupMessages:', groupMessages());
    console.log('[DEBUG] isConnected:', isConnected, 'ws:', ws);
  }, [wsMessages, groupMessages, isConnected, ws]);

  const handleSendMessage = useCallback(async () => {
  const trimmedMessage = chatState.messageText.trim();
  if (!trimmedMessage || !isMember || !isConnected) {
    console.log('[ChatRoom] Message not sent - validation failed', {
      hasText: !!trimmedMessage,
      isMember,
      isConnected,
      messageText: chatState.messageText
    });
    return;
  }

  try {
    if (!user) {
      console.error('[ChatRoom] Cannot send message - user not available');
      return;
    }

    const myUser = {
      _id: user._id,
      name: {
        first: user.name?.first || '',
        middle: user.name?.middle || '',
        last: user.name?.last || '',
      },
      username: user.username || ''
    };

    // ใช้ฟังก์ชันใหม่ที่จะส่งแค่ข้อความ
    const tempMessage = createTempMessage(trimmedMessage, myUser, replyState.replyTo);
    console.log('[ChatRoom] Creating temporary message:', tempMessage);

    // Add the message to local state immediately for instant feedback
    console.log('[ChatRoom] Adding message to local state...');
    addMessage(tempMessage);

    // Clear the input field and reply state
    console.log('[ChatRoom] Clearing input and reply state');
    updateChatState({ messageText: '' });
    updateReplyState({ replyTo: undefined });

    // **Directly send the plain string message**
    let messageToSend = trimmedMessage; // Plain string

    if (replyState.replyTo && replyState.replyTo.id) {
      // If replying, add the reply ID before the message
      messageToSend = `/reply ${replyState.replyTo.id} ${trimmedMessage}`;
    }

    console.log('[ChatRoom] Sending plain string message to WebSocket:', messageToSend);

    // Send the message directly as a string without wrapping in an object
    const success = await wsSendMessage(messageToSend);

    if (!success) {
      console.error('[ChatRoom] Failed to send message - WebSocket returned failure');
      updateChatState({
        ...chatState,
        error: ERROR_MESSAGES.SEND_FAILED,
        messageText: chatState.messageText // Keep the message text on error
      });
    } else {
      console.log(`[ChatRoom][${new Date().toISOString()}] Message sent successfully`);
    }
  } catch (error) {
    console.error('Error in handleSendMessage:', error);
    updateChatState({
      error: ERROR_MESSAGES.SEND_FAILED,
      messageText: chatState.messageText // Keep the message text on error
    });
  }
}, [chatState.messageText, chatState.room, isConnected, wsSendMessage, userId, addMessage, replyState.replyTo, updateChatState, updateReplyState, wsMessages, user, roomId, isMember]);


  const handleImageUpload = useCallback(async () => {
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
      const myUser = user ? {
        _id: user._id,
        name: {
          first: user.name?.first || '',
          middle: user.name?.middle || '',
          last: user.name?.last || '',
        },
        username: user.username || '',
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
    } catch (error) {
      console.error('Error sending sticker:', error);
    }
  }, [roomId, userId, addMessage, user?.name, updateUIState]);

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
  } catch (error) {
    }
  }, [wsSendMessage, addMessage]);

  // Modified handleTyping to avoid triggering while mentioning
  const handleTyping = () => {
    if (!mentionState.isMentioning) {
      originalHandleTyping();
    }
  };

  // After successful join, re-fetch membership
  const handleJoin = async () => {
    try {
      if (!chatState.room || isMember || chatState.joining) return;
      updateChatState({ joining: true });
      const result = await chatService.joinRoom(roomId);
      if (result.success && result.room) {
        updateChatState({ room: result.room });
        await fetchRoomMembership(); // Re-fetch membership after join
        console.log('[DEBUG] handleJoin: joined room, re-fetched isMember');
        // No need to call connectToWebSocket, socket will auto-connect
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
    connectedUsers,
    wsError: wsError ? new Error(wsError) : null, // Convert string error to Error object
    typing: typing.map(user => user.id), // Convert to string array of user IDs
    groupMessages: groupMessages(), // Call the function to get grouped messages
    inputRef,
    initializeRoom,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTyping,
    handleTextInput,
    handleMentionSelect,
    setMessageText: (text: string) => handleTextInput(text),
    setShowEmojiPicker: (show: boolean) => updateUIState({ showEmojiPicker: show }),
    setIsRoomInfoVisible: (show: boolean) => updateUIState({ isRoomInfoVisible: show }),
    setReplyTo: (message?: Message) => updateReplyState({ replyTo: message }),
    setShowStickerPicker: (show: boolean) => updateUIState({ showStickerPicker: show }),
    isMember,
  loadMembers,
  handleUnsendMessage,
};
};