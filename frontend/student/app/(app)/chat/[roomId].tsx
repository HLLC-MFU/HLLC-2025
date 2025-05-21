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
  const { roomId, join, userId: urlUserId } = useLocalSearchParams();
  const { user } = useProfile();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const userId = (urlUserId as string) || user?.id || '';

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const {
    isConnected,
    error: wsError,
    sendMessage: wsSendMessage,
    messages,
    connectedUsers,
    typing,
  } = useWebSocket(roomId as string);

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRoomInfoVisible, setIsRoomInfoVisible] = useState(false);

  const { isTyping, handleTyping } = useTypingIndicator();
  const groupMessages = useMessageGrouping(messages);

  const loadRoom = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatService.getRoom(roomId as string);
      if (!data) throw new Error(ERROR_MESSAGES.ROOM_NOT_FOUND);
      const isMember = await chatService.checkRoomMembership(roomId as string, userId);
      data.is_member = isMember;
      setRoom(data);
    } catch {
      setError(ERROR_MESSAGES.ROOM_NOT_FOUND);
    } finally {
      setLoading(false);
    }
  }, [roomId, userId]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  useEffect(() => {
    if (join === 'true' && room && !joinAttempted) {
      if (room.is_member || connectedUsers.some(u => u.id === userId)) {
        setRoom(prev => prev ? { ...prev, is_member: true } : null);
        setJoinAttempted(true);
      } else {
        setJoinAttempted(true);
        handleJoin();
      }
    }
  }, [join, room, connectedUsers, userId, joinAttempted]);
  
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), SCROLL_DELAY);
    }
  }, [messages]);

  const handleJoin = useCallback(async () => {
    if (!room || room.is_member || joining) return;
    setJoining(true);
    try {
      if (room.connected_users >= room.capacity) {
        Alert.alert('ห้องเต็ม', ERROR_MESSAGES.ROOM_FULL);
        return;
      }
      
      const success = await chatService.joinRoom(roomId as string);
      if (success) {
        setRoom(prev => prev ? { ...prev, is_member: true } : null);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Vibration.vibrate(80);
        }
      } else {
        setError(ERROR_MESSAGES.JOIN_FAILED);
      }
    } catch {
      setError(ERROR_MESSAGES.JOIN_ERROR);
    } finally {
      setJoining(false);
    }
  }, [room, roomId, joining]);
  
  const handleSendMessage = useCallback(() => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !room?.is_member || !isConnected) return;
    
    wsSendMessage(trimmedMessage);
    setMessageText('');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [messageText, room, isConnected, wsSendMessage]);

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

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={loadRoom} />;

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
          
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={groupMessages()}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={15}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
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
                placeholder={!isConnected 
                  ? PLACEHOLDER_MESSAGES.CONNECTING
                  : room?.is_member 
                    ? PLACEHOLDER_MESSAGES.TYPE_MESSAGE
                    : PLACEHOLDER_MESSAGES.JOIN_TO_CHAT}
                placeholderTextColor="#666"
                value={messageText}
                onChangeText={(text) => {
                  setMessageText(text);
                  handleTyping();
                }}
                editable={!!room?.is_member && isConnected}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
                autoCapitalize="none"
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={!room?.is_member || !isConnected}
              >
                <Smile color={(!room?.is_member || !isConnected) ? "#555" : "#0A84FF"} size={22} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  (!room?.is_member || !isConnected || !messageText.trim()) && styles.disabledSendButton
                ]}
                onPress={handleSendMessage}
                disabled={!room?.is_member || !isConnected || !messageText.trim()}
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