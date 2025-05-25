import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Send, 
  Users, 
  Info, 
  Image as ImageIcon, 
  Smile, 
  Mic, 
  MoreHorizontal,
  X,
  Reply,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import WebSocket from 'ws';
import * as ImagePicker from 'expo-image-picker';

// Components
import Avatar from './components/Avatar';
import MessageBubble from './components/MessageBubble';
import SystemMessage from './components/SystemMessage';
import TypingIndicator from './components/TypingIndicator';
import ErrorView from './components/ErrorView';
import JoinBanner from './components/JoinBanner';
import RoomInfoModal from './components/RoomInfoModal';
import StickerPicker from './components/StickerPicker';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';

// Hooks
import { useTypingIndicator } from './hooks/useTypingIndicator';
import { useMessageGrouping } from './hooks/useMessageGrouping';
import useProfile from '@/hooks/useProfile';
import { useWebSocket } from './hooks/useWebSocket';

// Services
import { chatService } from './services/chatService';

// Constants
import { 
  MAX_MESSAGE_LENGTH, 
  SCROLL_DELAY,
  PLACEHOLDER_MESSAGES,
  ERROR_MESSAGES,
  HEARTBEAT_INTERVAL,
  STYLES,
} from './constants/chatConstants';

// Utils
import { 
  triggerHapticFeedback, 
  triggerSuccessHaptic,
  createTempMessage,
  createFileMessage,
} from './utils/chatUtils';

// Types
import { ChatRoom, Message } from './types/chatTypes';

// Loading component
const Loader = () => (
  <View style={[styles.container, styles.centerContent]}>
    <StatusBar barStyle="light-content" />
    <ActivityIndicator size="large" color="#0A84FF" />
    <Text style={styles.loadingText}>กำลังโหลด...</Text>
  </View>
);

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useProfile();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const userId = user?._id || '';
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [language, setLanguage] = useState('th');
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

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRoomInfoVisible, setIsRoomInfoVisible] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const { isTyping, handleTyping } = useTypingIndicator();
  const groupMessages = useMessageGrouping(wsMessages);

  // Initialize room data
  const initializeRoom = useCallback(async () => {
    try {
      setLoading(true);
      // If room data is passed from navigation
      if (params.room) {
        const roomData = JSON.parse(params.room as string);
        setRoom(roomData);
        setIsMember(roomData.is_member || false);
        
        // Connect to WebSocket if member
        if (roomData.is_member && (!ws || ws.readyState !== WebSocket.OPEN)) {
          await wsConnect(roomId);
          // Start heartbeat after successful connection
          startHeartbeat();
        }
      } else {
        // Fetch room data
        const roomData = await chatService.getRoom(roomId);
        if (!roomData) {
          throw new Error('Room not found');
        }
        setRoom(roomData);
        setIsMember(roomData.is_member || false);
        
        // Connect to WebSocket if member
        if (roomData.is_member && (!ws || ws.readyState !== WebSocket.OPEN)) {
          await wsConnect(roomId);
          // Start heartbeat after successful connection
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
          // Attempt to reconnect
          if (room?.is_member) {
            wsConnect(roomId);
          }
        }
      } else {
        clearInterval(heartbeatInterval);
        // Attempt to reconnect if disconnected
        if (room?.is_member) {
          wsConnect(roomId);
        }
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
      if (heartbeatCleanup) {
        heartbeatCleanup();
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
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

  useEffect(() => {
    if (wsMessages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), SCROLL_DELAY);
    }
  }, [wsMessages]);

  const renderItem = useCallback(({ item }: { item: Message[] }) => {
    if (item.length === 1 && (item[0].type === 'join' || item[0].type === 'leave')) {
      return <SystemMessage text={item[0].text || ''} timestamp={item[0].timestamp} />;
    }
    
    return (
      <View style={styles.messageGroup}>
        {item.map((message: Message, index: number) => {
          const isMyMessage = message.senderId === userId;
          const isLastInGroup = index === item.length - 1;
          const isFirstInGroup = index === 0;
          
          return (
            <MessageBubble 
              key={message.id || `msg-${index}`}
              message={message} 
              isMyMessage={isMyMessage} 
              senderId={message.senderId}
              senderName={message.senderName}
              isRead={message.isRead}
              showAvatar={!isMyMessage && isLastInGroup}
              isLastInGroup={isLastInGroup}
              isFirstInGroup={isFirstInGroup}
            />
          );
        })}
      </View>
    );
  }, [userId]);

  const keyExtractor = useCallback((item: Message[], idx: number) => {
    if (item.length === 1) {
      return item[0].id ?? `group-${idx}`;
    }
    return `group-${idx}`;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && groupMessages().length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [groupMessages]);

  useEffect(() => {
    if (wsMessages.length > 0) {
      scrollToBottom();
    }
  }, [wsMessages, scrollToBottom]);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleImageUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const formData = new FormData();
        
        // Create file object with the correct structure
        const file = {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'image/jpeg',
          name: result.assets[0].fileName || 'image.jpg',
        };

        // Append each field exactly as backend expects
        formData.append('file', file as any);
        formData.append('roomId', roomId);
        formData.append('userId', userId);

        console.log('Uploading image with form data:', {
          file,
          roomId,
          userId
        });

        const response = await fetch(`http://localhost:1334/api/v1/rooms/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Upload failed with response:', errorData);
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        console.log('Upload response:', data);
        
        // Add message to WebSocket messages immediately
        const tempMessage = {
          id: data._id,
          fileUrl: data.file_url, // Use the file_url directly from the response
          fileName: data.file_name,
          fileType: data.file_type,
          senderId: data.user_id,
          senderName: data.user_id,
          type: 'file' as const,
          timestamp: data.timestamp,
          isRead: false,
        };

        console.log('Created message object:', tempMessage);
        addMessage(tempMessage);
        
        // Scroll to bottom after sending
        scrollToBottom();
        
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  }, [roomId, userId, addMessage, scrollToBottom]);

  const handleSendSticker = useCallback(async (stickerId: string) => {
    try {
      const response = await fetch(
        `http://localhost:1334/api/v1/rooms/${roomId}/stickers?userId=${userId}&stickerId=${stickerId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to send sticker');
      }

      setShowStickerPicker(false);
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending sticker:', error);
      Alert.alert('Error', 'Failed to send sticker');
    }
  }, [roomId, userId]);

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !room?.is_member || !isConnected) return;
    
    try {
      console.log('Sending message:', trimmedMessage);
      
      // Create temporary message for immediate display
      const tempMessage = createTempMessage(trimmedMessage, userId, replyTo);

      // Add message to WebSocket messages immediately
      addMessage(tempMessage);
      
      // Send message via WebSocket
      if (replyTo) {
        wsSendMessage(`/reply ${replyTo.id} ${trimmedMessage}`);
      } else {
        wsSendMessage(trimmedMessage);
      }
      
      // Clear input and reply after sending
      setMessageText('');
      setReplyTo(null);
      
      // Scroll to bottom after sending
      scrollToBottom();
      
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(ERROR_MESSAGES.SEND_FAILED);
    }
  }, [messageText, room, isConnected, wsSendMessage, userId, addMessage, scrollToBottom, replyTo]);

  const handleJoin = async () => {
    try {
      if (!room || room.is_member || joining) return;
      setJoining(true);

      const result = await chatService.joinRoom(roomId);
      
      if (result.success && result.room) {
        setRoom(result.room);
        setIsMember(true);
        
        // Connect to WebSocket after successful join
        if (ws) {
          ws.close();
        }
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

  const handleWebSocketMessage = useCallback((event: WebSocket.MessageEvent) => {
    try {
      const data = JSON.parse(event.data.toString());
      console.log('WebSocket message received:', data);

      if (data.eventType === 'history') {
        const chatData = data.payload.chat;
        console.log('Parsed history message:', chatData);

        // Skip file name messages
        if (chatData.message?.startsWith('[file]')) {
          console.log('Skipping file name message:', chatData.message);
          return;
        }

        // Skip empty messages
        if (!chatData.message && !chatData.file_url && !chatData.stickerId) {
          console.log('Skipping empty message:', chatData);
          return;
        }

        // Create message object based on type
        let message: Message;
        
        if (chatData.file_url) {
          message = {
            id: chatData.id,
            fileUrl: chatData.file_url,
            fileName: chatData.file_name,
            fileType: chatData.file_type,
            senderId: chatData.user_id,
            senderName: chatData.user_id,
            type: 'file',
            timestamp: chatData.timestamp,
            isRead: false,
          };
        
          console.log('Created file message from history:', message);
        } else if (chatData.stickerId) {
          message = {
            id: chatData.id,
            image: chatData.image,
            stickerId: chatData.stickerId,
            senderId: chatData.user_id,
            senderName: chatData.user_id,
            type: 'sticker',
            timestamp: chatData.timestamp,
            isRead: false,
          };
        } else if (chatData.message) {
          message = {
            id: chatData.id,
            text: chatData.message,
            senderId: chatData.user_id,
            senderName: chatData.user_id,
            type: 'message',
            timestamp: chatData.timestamp,
            isRead: false,
          };
        } else {
          console.log('Skipping message with no content:', chatData);
          return;
        }

        console.log('Adding history message:', message);
        addMessage(message);
      } else if (data.eventType === 'message') {
        const messageData = data.payload;
        console.log('Received new message:', messageData);

        // Skip file name messages since we already have the file message
        if (messageData.message?.startsWith('[file]')) {
          console.log('Skipping file name message:', messageData.message);
          return;
        }

        const message: Message = {
          id: Date.now().toString(),
          text: messageData.message,
          senderId: messageData.userId,
          senderName: messageData.userId,
          type: 'message',
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        addMessage(message);
      } else if (data.eventType === 'sticker') {
        const stickerData = data.payload;
        const message: Message = {
          id: Date.now().toString(),
          image: stickerData.sticker,
          stickerId: stickerData.stickerId,
          senderId: stickerData.userId,
          senderName: stickerData.userId,
          type: 'sticker',
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        addMessage(message);
      } else if (data.eventType === 'file') {
        const fileData = data.payload;
        console.log('Received file message:', fileData);
        
        const message: Message = {
          id: Date.now().toString(),
          fileUrl: fileData.fileURL,
          fileName: fileData.fileName,
          fileType: fileData.fileType,
          senderId: fileData.userId,
          senderName: fileData.userId,
          type: 'file',
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        console.log('Created file message:', message);
        addMessage(message);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [addMessage]);

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={initializeRoom} />;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowEmojiPicker(false);
      setShowStickerPicker(false);
    }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerInfo}
              onPress={() => setIsRoomInfoVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>
                {room?.name?.th_name || 'ห้องแชท'}
              </Text>
              <View style={styles.memberInfo}>
                <Users size={14} color="#0A84FF" />
                <Text style={styles.memberCount}>
                  {connectedUsers.length} คนออนไลน์
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setIsRoomInfoVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Info color="#0A84FF" size={20} />
            </TouchableOpacity>
          </View>

          {/* Connection status indicator */}
          {wsError && (
            <View style={styles.connectionError}>
              <Text style={styles.connectionErrorText}>การเชื่อมต่อขัดข้อง กำลังลองใหม่...</Text>
            </View>
          )}
          
          {/* Join Room Banner */}
          {!room?.is_member && (
            <JoinBanner 
              onJoin={handleJoin} 
              joining={joining} 
              roomCapacity={room?.capacity || 0}
              connectedCount={connectedUsers.length}
            />
          )}
          
          {/* Reply Banner */}
          {replyTo && (
            <View style={styles.replyBanner}>
              <View style={styles.replyBannerContent}>
                <Reply size={16} color="#0A84FF" />
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  Replying to {replyTo.senderName || replyTo.senderId}: {replyTo.text}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancelReply}>
                <X size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Messages List */}
          <MessageList
            messages={groupMessages()}
            userId={userId}
            typing={typing}
            flatListRef={flatListRef}
            onReply={handleReply}
            scrollToBottom={scrollToBottom}
          />
          
          {/* Input Area */}
          <ChatInput
            messageText={messageText}
            setMessageText={setMessageText}
            handleSendMessage={handleSendMessage}
            handleImageUpload={handleImageUpload}
            handleTyping={handleTyping}
            isMember={!!room?.is_member}
            isConnected={isConnected}
            inputRef={inputRef}
            setShowStickerPicker={setShowStickerPicker}
            showStickerPicker={showStickerPicker}
          />
          
          {/* Room Info Modal */}
          <RoomInfoModal 
            room={room as ChatRoom} 
            isVisible={isRoomInfoVisible} 
            onClose={() => setIsRoomInfoVisible(false)}
            connectedUsers={connectedUsers}
          />

          {/* Sticker Picker Modal */}
          {showStickerPicker && (
            <StickerPicker
              onSelectSticker={handleSendSticker}
              onClose={() => setShowStickerPicker(false)}
            />
          )}
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  ...STYLES,
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  safeArea: { 
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: { 
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff',
  },
  memberInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 4 
  },
  memberCount: { 
    fontSize: 12, 
    color: '#999' 
  },
  infoButton: {
    padding: 8,
  },
  connectionError: {
    backgroundColor: '#cc3300',
    padding: 8,
    alignItems: 'center',
  },
  connectionErrorText: {
    color: '#fff',
    fontSize: 12,
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    color: '#0A84FF',
    marginTop: 12,
    fontSize: 16,
  },
  messageGroup: {
    marginBottom: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  replyBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  replyBannerText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
});