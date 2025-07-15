import React, { useRef, useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Users, Info, Loader } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BlurView } from 'expo-blur';

// Hooks
import { useChatRoom } from '../../../hooks/chats/useChatRoom';
import useProfile from '@/hooks/useProfile';

// Types
import { ChatRoom, RoomMember, Message } from '../../../types/chatTypes';

// Styles
import { chatStyles } from '../../../constants/chats/chatStyles';
import ChatInput from '@/components/chats/ChatInput';
import ErrorView from '@/components/chats/ErrorView';
import JoinBanner from '@/components/chats/JoinBanner';
import MessageList from '@/components/chats/MessageList';
import RoomInfoModal from '@/components/chats/RoomInfoModal';
import EvoucherModal from '@/components/chats/EvoucherModal';
import StickerPicker from '@/components/chats/StickerPicker';
import MentionSuggestions from '@/components/chats/MentionSuggestions';

export default function ChatRoomPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const flatListRef = useRef<FlatList | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showEvoucherModal, setShowEvoucherModal] = useState(false);
  const { user } = useProfile();

  // Function to get room name based on current language
  const getRoomName = (room: any) => {
    if (!room?.name) return t('chat.chatRoom');
    
    const currentLang = i18n.language;
    if (currentLang === 'th' && room.name.th) {
      return room.name.th;
    } else if (currentLang === 'en' && room.name.en) {
      return room.name.en;
    }
    
    // Fallback: try th first, then en, then default
    return room.name.th || room.name.en || t('chat.chatRoom');
  };
  
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
    roomId,
    groupMessages,
    mentionSuggestions,
    isMentioning,
    members,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTyping,
    handleMentionSelect,
    handleTextInput,
    initializeRoom,
    loadMembers,
    handleUnsendMessage,
  } = useChatRoom();

  // Check if user has permission to send evoucher
  const canSendEvoucher = () => {
    if (!user?.data?.[0]?.role?.name) return false;
    const userRole = user.data[0].role.name;
    return userRole === 'Administrator' || userRole === 'AE';
  };

  const isAdminOrAE = canSendEvoucher();

  // Check if should show evoucher button
  const shouldShowEvoucherButton = () => {
    return room?.type === 'readonly' && canSendEvoucher();
  };

  // โหลดสมาชิกห้องทันทีที่เข้าแชท
  useEffect(() => {
    // โหลดสมาชิกเฉพาะเมื่อ room ถูก initialize แล้ว
    if (room && !loading) {
      loadMembers(1, false);
    }
  }, [room, loading, loadMembers]);

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
  const handleScroll = (event: {
    nativeEvent: {
      layoutMeasurement: any;
      contentOffset: any;
      contentSize: any;
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
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
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          setShowEmojiPicker(false);
          setShowStickerPicker(false);
        }}
      >
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
                  {getRoomName(room)}
                </Text>
                <View style={chatStyles.memberInfo}>
                  <Users size={14} color="#0A84FF" />
                  <Text style={chatStyles.memberCount}>
                    {room?.members_count}{' '}
                    {t('chat.members')}
                  </Text>
                </View>
              </TouchableOpacity>

              {shouldShowEvoucherButton() ? (
                <TouchableOpacity
                  style={chatStyles.infoButton}
                  onPress={() => setShowEvoucherModal(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Info color="#0A84FF" size={20} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={chatStyles.infoButton}
                  onPress={() => setIsRoomInfoVisible(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Info color="#0A84FF" size={20} />
                </TouchableOpacity>
              )}
            </View>

            {/* Connection status indicator */}
            {wsError && (
              <View style={chatStyles.connectionError}>
                <Text style={chatStyles.connectionErrorText}>
                  {t('chat.connectionError')}
                </Text>
              </View>
            )}

            {/* Join Room Banner */}
            {!isMember && (
              <JoinBanner
                onJoin={handleJoin}
                joining={joining}
                roomCapacity={room?.capacity || 0}
                connectedCount={
                  Array.isArray(room?.members_count) ? room.members_count : 0
                }
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
                onUnsend={handleUnsendMessage}
              />
              {showScrollToBottom && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    bottom: 60,
                    right: 20,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 24,
                    padding: 10,
                    zIndex: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                  }
                >
                  <Text style={{ color: '#fff', fontSize: 16 }}>{t('chat.scrollToBottom')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Mention Suggestions */}
            {isMentioning && (
              <MentionSuggestions
                suggestions={mentionSuggestions}
                onSelect={handleMentionSelect}
              />
            )}

            {/* Input Area */}
            {room?.type === 'readonly' && !isAdminOrAE ? (
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: 16,
                margin: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
              }}>
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  {t('chat.readonlyRoom')}
                </Text>
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 4,
                }}>
                  {t('chat.readonlyMessage')}
                </Text>
              </View>
            ) : (
              <ChatInput
                messageText={messageText}
                handleTextInput={handleTextInput}
                handleSendMessage={handleSendMessageWithScroll}
                handleImageUpload={handleImageUpload}
                handleTyping={handleTyping}
                isMember={isMember}
                isConnected={isConnected}
                inputRef={inputRef}
                setShowStickerPicker={setShowStickerPicker}
                showStickerPicker={showStickerPicker}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                canSendImage={isAdminOrAE}
              />
            )}

            {/* Room Info Modal */}
            <RoomInfoModal
              room={room as ChatRoom}
              isVisible={isRoomInfoVisible}
              onClose={() => setIsRoomInfoVisible(false)}
                                connectedUsers={
                    Array.isArray(members) && members.length > 0
                      ? members.map((member) => ({
                          id: member.user_id || member.user._id,
                          name:
                            member.user_id === userId
                              ? t('chat.you')
                              : member.user.name
                              ? `${member.user.name.first || ''} ${member.user.name.last || ''}`.trim() || member.user.username || t('chat.unknownUser')
                              : member.user.username || t('chat.unknownUser'),
                          online: true,
                        }))
                      : []
                  }
            />

            {/* Sticker Picker Modal */}
            {showStickerPicker && (
              <StickerPicker
                onSelectSticker={handleSendSticker}
                onClose={() => setShowStickerPicker(false)}
              />
            )}

            {/* Evoucher Modal */}
            <EvoucherModal
              roomId={roomId}
              isVisible={showEvoucherModal}
              onClose={() => setShowEvoucherModal(false)}
              onSuccess={() => {
                // Optionally refresh messages or show success message
                console.log('Evoucher sent successfully');
              }}
            />
          </SafeAreaView>
        </BlurView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
