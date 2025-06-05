import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Users, 
  Info, 
  X,
  Reply,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

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
import Loader from './components/Loader';

// Hooks
import { useChatRoom } from './hooks/useChatRoom';

// Types
import { ChatRoom } from './types/chatTypes';

// Styles
import { chatStyles } from './constants/chatStyles';

export default function ChatRoomPage() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const {
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
    inputRef,
    userId,
    groupMessages,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTyping,
    initializeRoom,
  } = useChatRoom();

  // Add auto-scroll effect
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [groupMessages()]); // Scroll when messages change

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={initializeRoom} />;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowEmojiPicker(false);
      setShowStickerPicker(false);
    }}>
      <View style={chatStyles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={chatStyles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={chatStyles.header}>
            <TouchableOpacity 
              style={chatStyles.backButton} 
              onPress={() => router.replace('/chat')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={chatStyles.headerInfo}
              onPress={() => setIsRoomInfoVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={chatStyles.headerTitle} numberOfLines={1}>
                {room?.name?.th_name || 'ห้องแชท'}
              </Text>
              <View style={chatStyles.memberInfo}>
                <Users size={14} color="#0A84FF" />
                <Text style={chatStyles.memberCount}>
                  {connectedUsers.length} คนออนไลน์
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={chatStyles.infoButton}
              onPress={() => setIsRoomInfoVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Info color="#0A84FF" size={20} />
            </TouchableOpacity>
          </View>

          {/* Connection status indicator */}
          {wsError && (
            <View style={chatStyles.connectionError}>
              <Text style={chatStyles.connectionErrorText}>การเชื่อมต่อขัดข้อง กำลังลองใหม่...</Text>
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
            <View style={chatStyles.replyBanner}>
              <View style={chatStyles.replyBannerContent}>
                <Reply size={16} color="#0A84FF" />
                <Text style={chatStyles.replyBannerText} numberOfLines={1}>
                  Replying to {replyTo.senderName || replyTo.senderId}: {replyTo.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyTo(undefined)}>
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
            onReply={setReplyTo}
            scrollToBottom={() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
              }
            }}
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