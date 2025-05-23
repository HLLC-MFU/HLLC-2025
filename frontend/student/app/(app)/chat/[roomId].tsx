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
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import WebSocket from 'ws';

// Components
import Avatar from './components/Avatar';
import MessageBubble from './components/MessageBubble';
import SystemMessage from './components/SystemMessage';
import TypingIndicator from './components/TypingIndicator';
import ErrorView from './components/ErrorView';
import JoinBanner from './components/JoinBanner';
import RoomInfoModal from './components/RoomInfoModal';

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
        if (roomData.is_member) {
          await wsConnect(roomId);
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
        if (roomData.is_member) {
          await wsConnect(roomId);
        }
      }
    } catch (err) {
      console.error('Error initializing room:', err);
      setError('Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [roomId, params.room, wsConnect]);

  // Handle WebSocket connection
  useEffect(() => {
    let mounted = true;
    let reconnectTimeout: NodeJS.Timeout;

    const setupWebSocket = async () => {
      if (!room?.is_member || !mounted) return;
      
      try {
        await wsConnect(roomId);
      } catch (err) {
        console.error('Error connecting to WebSocket:', err);
        setError('Failed to connect to chat');
        
        // Attempt to reconnect after 3 seconds
        if (mounted) {
          reconnectTimeout = setTimeout(setupWebSocket, 3000);
        }
      }
    };

    setupWebSocket();

    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      wsDisconnect();
    };
  }, [room?.is_member, roomId, wsConnect, wsDisconnect]);

  useEffect(() => {
    if (wsMessages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), SCROLL_DELAY);
    }
  }, [wsMessages]);

  // Initialize room on mount
  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

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
        isRead: false
      };

      // Add message to WebSocket messages immediately
      addMessage(tempMessage);
      
      // Send message via WebSocket
      wsSendMessage(trimmedMessage);
      
      // Clear input after sending
      setMessageText('');
      
      // Scroll to bottom after sending
      scrollToBottom();
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  }, [messageText, room, isConnected, wsSendMessage, userId, addMessage, scrollToBottom]);

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
                {room?.name?.th || 'ห้องแชท'}
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
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
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
});