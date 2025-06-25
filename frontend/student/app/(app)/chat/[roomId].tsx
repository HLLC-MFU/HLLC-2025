import React, { useRef, useState } from 'react';
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
  Loader,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { BlurView } from 'expo-blur';

// Hooks
import { useChatRoom } from '../../../hooks/chats/useChatRoom';

// Types
import { ChatRoom } from '../../../types/chatTypes';

// Styles
import { chatStyles } from '../../../constants/chats/chatStyles';
import ChatInput from '@/components/chats/ChatInput';
import ErrorView from '@/components/chats/ErrorView';
import JoinBanner from '@/components/chats/JoinBanner';
import MessageList from '@/components/chats/MessageList';
import RoomInfoModal from '@/components/chats/RoomInfoModal';
import StickerPicker from '@/components/chats/StickerPicker';

export default function ChatRoomPage() {
  const router = useRouter();
  const flatListRef = useRef<FlatList | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
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
    roomMembers,
    loadingMembers,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTyping,
    initializeRoom,
  } = useChatRoom();

  // Scroll to bottom after sending message
  const handleSendMessageWithScroll = () => {
    handleSendMessage();
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // Show scroll to bottom button if not at bottom
  const handleScroll = (event: { nativeEvent: { layoutMeasurement: any; contentOffset: any; contentSize: any; }; }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setShowScrollToBottom(!isAtBottom);
  };

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={initializeRoom} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setShowEmojiPicker(false);
        setShowStickerPicker(false);
      }}>
        <BlurView intensity={40} tint="dark" style={chatStyles.container}>
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
                  {room?.name?.th || room?.name?.en || 'ห้องแชท'}
                </Text>
                <View style={chatStyles.memberInfo}>
                  <Users size={14} color="#0A84FF" />
                  <Text style={chatStyles.memberCount}>
                    {roomMembers?.members?.length || 0} members
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
                connectedCount={roomMembers?.members?.length || 0}
              />
            )}
            
        
            
            {/* Messages List */}
            <View style={{ flex: 1 }}>
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
                onScroll={handleScroll}
                scrollEventThrottle={16}
              />
              {showScrollToBottom && (
                <TouchableOpacity
                  style={{ position: 'absolute', bottom: 60, right: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 24, padding: 10, zIndex: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}
                  onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
                >
                  <Text style={{ color: '#fff', fontSize: 16 }}>↓</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Input Area */}
            <ChatInput
              messageText={messageText}
              setMessageText={setMessageText}
              handleSendMessage={handleSendMessageWithScroll}
              handleImageUpload={handleImageUpload}
              handleTyping={handleTyping}
              isMember={!!room?.is_member}
              isConnected={isConnected}
              inputRef={inputRef}
              setShowStickerPicker={setShowStickerPicker}
              showStickerPicker={showStickerPicker}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
            />
            
            {/* Room Info Modal */}
            <RoomInfoModal 
              room={room as ChatRoom} 
              isVisible={isRoomInfoVisible} 
              onClose={() => setIsRoomInfoVisible(false)}
              connectedUsers={roomMembers?.members?.map(member => ({
                id: member.user_id,
                name: `${member.user.name.first} ${member.user.name.middle} ${member.user.name.last}`.trim(),
                online: true // Assume all members are online since they are room members
              })) || []}
            />

            {/* Sticker Picker Modal */}
            {showStickerPicker && (
              <StickerPicker
                onSelectSticker={handleSendSticker}
                onClose={() => setShowStickerPicker(false)}
              />
            )}
          </SafeAreaView>
        </BlurView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}