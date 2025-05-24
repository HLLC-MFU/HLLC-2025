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
} from './constants/chatConstants';

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
    }, 30000); // Send heartbeat every 30 seconds

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
      return <SystemMessage text={item[0].text} timestamp={item[0].timestamp} />;
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
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'image.jpg',
        } as any);
        formData.append('roomId', roomId);
        formData.append('userId', userId);

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/chats/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  }, [roomId, userId]);

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
      const tempMessage = {
        id: Date.now().toString(),
        text: trimmedMessage,
        senderId: userId,
        senderName: userId,
        type: 'message' as const,
        timestamp: new Date().toISOString(),
        isRead: false,
        replyTo: replyTo ? {
          id: replyTo.id || '',
          text: replyTo.text,
          senderId: replyTo.senderId,
          senderName: replyTo.senderName,
        } : undefined,
      };

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
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
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
        
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Vibration.vibrate(80);
        }
      } else {
        throw new Error(result.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError(language === 'th' ? 'ไม่สามารถเข้าร่วมห้องแชทได้' : 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

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
          <FlatList
            ref={flatListRef}
            data={groupMessages()}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
            onEndReachedThreshold={0.5}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />
          
          {/* Typing indicators */}
          {typing && typing.length > 0 && (
            <TypingIndicator typingUsers={typing} />
          )}
          
          {/* Input Area */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.inputContainer}
          >
            <View style={styles.inputWrapper}>
              <TouchableOpacity 
                style={styles.attachButton}
                onPress={handleImageUpload}
                disabled={!room?.is_member || !isConnected}
              >
                <ImageIcon color={(!room?.is_member || !isConnected) ? "#555" : "#0A84FF"} size={22} />
              </TouchableOpacity>
              
              <TextInput
                ref={inputRef}
                style={[
                  styles.input, 
                  (!room?.is_member || !isConnected) && styles.disabledInput
                ]}
                placeholder={
                  !room?.is_member 
                    ? PLACEHOLDER_MESSAGES.JOIN_TO_CHAT
                    : !isConnected 
                      ? PLACEHOLDER_MESSAGES.CONNECTING
                      : PLACEHOLDER_MESSAGES.TYPE_MESSAGE
                }
                placeholderTextColor="#666"
                value={messageText}
                onChangeText={(text) => {
                  setMessageText(text);
                  handleTyping();
                }}
                editable={!!room?.is_member}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
                autoCapitalize="none"
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setShowStickerPicker(!showStickerPicker)}
                disabled={!room?.is_member}
              >
                <Smile color={!room?.is_member ? "#555" : "#0A84FF"} size={22} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  (!room?.is_member || !messageText.trim()) && styles.disabledSendButton
                ]}
                onPress={handleSendMessage}
                disabled={!room?.is_member || !messageText.trim()}
                activeOpacity={0.7}
              >
                <Send color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
          
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
  messagesContent: { 
    padding: 16, 
    paddingBottom: 80,
    
  },
  inputContainer: { 
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1, 
    borderTopColor: '#2A2A2A',
    paddingVertical: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { 
    flex: 1, 
    backgroundColor: '#333', 
    borderRadius: 20, 
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#fff', 
    marginHorizontal: 8,
    maxHeight: 120,
    minHeight: 40,
    fontSize: 16,
  },
  disabledInput: { 
    opacity: 0.6 
  },
  attachButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: { 
    backgroundColor: '#0A84FF', 
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  disabledSendButton: { 
    backgroundColor: '#555', 
    opacity: 0.5 
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
  stickerPicker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    padding: 16,
    maxHeight: 300,
  },
});