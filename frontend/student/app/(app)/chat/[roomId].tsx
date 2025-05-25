import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Users, 
  Info,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import WebSocket from 'ws';
import { Ionicons } from '@expo/vector-icons';

// Components
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import ErrorView from './components/ErrorView';
import JoinBanner from './components/JoinBanner';
import RoomInfoModal from './components/RoomInfoModal';
import StickerPicker from './components/StickerPicker';

// Hooks
import { useTypingIndicator } from './hooks/useTypingIndicator';
import { useMessageGrouping } from './hooks/useMessageGrouping';
import useProfile from '@/hooks/useProfile';
import { useWebSocket } from './hooks/useWebSocket';
import { useRoom } from './hooks/useRoom';
import { useMessages } from './hooks/useMessages';

// Constants
import { STYLES } from './constants/chatConstants';

// Types
import { Message } from './types/chatTypes';

// Loading component
const Loader = () => (
  <View style={[STYLES.CONTAINER, styles.centerContent]}>
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

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRoomInfoVisible, setIsRoomInfoVisible] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const { isTyping, handleTyping } = useTypingIndicator();
  const {
    room,
    isMember,
    loading,
    error,
    joining,
    initializeRoom,
    handleJoin,
  } = useRoom(roomId);

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

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && groupMessages().length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [groupMessages]);

  const { handleSendMessage } = useMessages(
    userId,
    wsSendMessage,
    addMessage,
    scrollToBottom
  );

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleSendSticker = useCallback((stickerId: string, sticker: string) => {
    if (!ws || !room) return;
    ws.sendSticker(stickerId, sticker);
    setShowStickerPicker(false);
  }, [ws, room]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!ws || !room) return;
    ws.sendImage(file);
  }, [ws, room]);

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={() => initializeRoom()} />;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowEmojiPicker(false);
      setShowStickerPicker(false);
    }}>
      <View style={STYLES.CONTAINER}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={STYLES.SAFE_AREA} edges={['top']}>
          {/* Header */}
          <View style={STYLES.HEADER}>
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
            handleSendMessage={() => handleSendMessage(messageText, replyTo, setMessageText, setReplyTo)}
            handleTyping={handleTyping}
            isMember={!!room?.is_member}
            isConnected={isConnected}
            inputRef={inputRef}
            setShowStickerPicker={setShowStickerPicker}
            showStickerPicker={showStickerPicker}
            handleImageUpload={handleImageUpload}
          />
          
          {/* Room Info Modal */}
          {room && (
            <RoomInfoModal 
              room={room}
              isVisible={isRoomInfoVisible} 
              onClose={() => setIsRoomInfoVisible(false)}
              connectedUsers={connectedUsers}
            />
          )}

          {/* Sticker Picker Modal */}
          {showStickerPicker && (
            <StickerPicker
              onSelect={(stickerId, sticker) => handleSendSticker(stickerId, sticker)}
              onClose={() => setShowStickerPicker(false)}
            />
          )}
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
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
});