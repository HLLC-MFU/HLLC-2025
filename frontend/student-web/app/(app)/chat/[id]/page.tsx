'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useChatRoom } from '@/hooks/chats/useChatRoom';
import { useProfile } from '@/hooks/useProfile';
import { ChatRoom } from '@/types/chat';
import ChatInput from '@/app/(app)/chat/_components/ChatInput';
import ErrorView from '@/app/(app)/chat/_components/ErrorView';
import JoinBanner from '@/app/(app)/chat/_components/JoinBanner';
import MessageList from '@/app/(app)/chat/_components/MessageList';
import RoomInfoModal from '@/app/(app)/chat/_components/RoomInfoModal';
import EvoucherModal from '@/app/(app)/chat/_components/EvoucherModal';
import StickerPicker from '@/app/(app)/chat/_components/StickerPicker';
import MentionSuggestions from '@/app/(app)/chat/_components/MentionSuggestions';
import { Users, Info, Loader, ChevronLeft } from 'lucide-react';

export default function ChatRoomPage() {
  const params = useParams();
  console.log('[ChatRoomPage] MOUNT', params);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const flatListRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showEvoucherModal, setShowEvoucherModal] = useState(false);
  const { user } = useProfile();

  const getRoomName = (room: any) => {
    if (!room?.name.end) return t('chat.chatRoom');
    const currentLang = i18n.language;
    if (currentLang === 'th' && room.name.th) {
      return room.name.th;
    } else if (currentLang === 'en' && room.name.en) {
      return room.name.en;
    }
    return room.name.th || room.name.en || t('chat.chatRoom');
  };

  const chatRoom = useChatRoom({
    user: {
      _id: user?._id || '',
      name: user?.name,
      username: user?.username
    }
  });

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
  } = chatRoom;

  const canSendEvoucher = () => {
    return false;
  };
  const isAdminOrAE = canSendEvoucher();
  const shouldShowEvoucherButton = () => {
    return room?.type === 'readonly' && canSendEvoucher();
  };

  // Debug log for membership and connection state
  useEffect(() => {
    console.log('[ChatRoomPage] isMember:', isMember, 'isConnected:', isConnected, 'room:', room, 'userId:', userId);
  }, [isMember, isConnected, room, userId]);

  useEffect(() => {
    console.log('[ChatRoomPage] useEffect params', params);
    if (room && !loading) {
      loadMembers(1, false);
    }
  }, [room, loading, loadMembers, params]);

  const handleSendMessageWithScroll = () => {
    console.log('[DEBUG] handleSendMessageWithScroll called', { isMember, isConnected, messageText });
    
    // Only send message if there's actual content and we're connected
    if (messageText.trim() && isConnected) {
      handleSendMessage();
      
      // Clear the input after sending
      setMessageText('');
      
      // Scroll to bottom after a short delay to ensure message is rendered
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollTop = flatListRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 20;
    setShowScrollToBottom(!isAtBottom);
  };

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={initializeRoom} />;

  return (
    <div className="fixed inset-0 flex flex-col w-full h-full min-h-screen from-blue-100 via-blue-200 to-blue-300 backdrop-blur-2xl overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 h-full justify-between">
        <div className="flex items-center p-4 border-b border-white/30 bg-white/40 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 mt-4">
          <button
            className="mr-4 p-2 rounded hover:bg-white/30"
            onClick={() => router.replace('/chat')}
          >
            <ChevronLeft color="#0A84FF" size={24} />
          </button>
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsRoomInfoVisible(true)}
          >
            <span className="text-lg font-semibold text-gray-900 truncate block drop-shadow">
              {getRoomName(room)}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Users size={14} color="#0A84FF" />
              <span className="text-xs text-blue-500">{room?.members_count} {t('chat.members')}</span>
            </div>
          </div>
          <button
            className="ml-4 p-2 rounded hover:bg-white/30"
            onClick={() => setIsRoomInfoVisible(true)}
          >
            <Info color="#0A84FF" size={20} />
          </button>
        </div>

        {/* Connection status indicator */}
        {wsError && (
          <div className="bg-red-100 text-red-700 p-2 text-center">
            {t('chat.connectionError')}
          </div>
        )}

        {/* Join Room Banner */}
        {!isMember && (
          <div className="px-4 pt-4">
            <JoinBanner
              onJoin={handleJoin}
              joining={joining}
              roomCapacity={room?.capacity || 0}
              connectedCount={Array.isArray(room?.members_count) ? room.members_count : 0}
            />
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 relative w-full h-full overflow-hidden">
          <div className="absolute inset-0 w-full h-full flex flex-col justify-end">
            <div className="flex-1 overflow-y-auto scrollbar-none px-2 py-4 bg-white/30 backdrop-blur-lg backdrop-saturate-150 rounded-3xl shadow-2xl border border-white/30 mx-2 mt-2 mb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
              <MessageList
                messages={groupMessages}
                userId={userId}
                typing={typing ? typing.map(id => ({ id })) : []}
                flatListRef={flatListRef}
                onReply={setReplyTo}
                scrollToBottom={() => {
                  if (flatListRef.current) {
                    flatListRef.current.scrollTop = flatListRef.current.scrollHeight;
                  }
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onUnsend={handleUnsendMessage}
              />
              {showScrollToBottom && (
                <button
                  className="fixed bottom-32 right-8 bg-white/60 rounded-full px-4 py-2 text-blue-700 shadow-lg z-10"
                  onClick={() => {
                    if (flatListRef.current) {
                      flatListRef.current.scrollTop = flatListRef.current.scrollHeight;
                    }
                  }}
                >
                  {t('chat.scrollToBottom')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mention Suggestions */}
        {isMentioning && (
          <MentionSuggestions
            suggestions={mentionSuggestions}
            onSelect={handleMentionSelect}
          />
        )}

        {/* Input Area - glassy, ติดขอบล่าง */}
        <div className="fixed bottom-0 left-0 w-full flex justify-center z-20 pointer-events-none">
        <div className="w-full max-w-2xl px-4 pb-4 pointer-events-auto">
          <div className="bg-white/40 backdrop-blur rounded-2xl shadow-xl border border-white/30">
            <ChatInput
                messageText={messageText}
                handleTextInput={handleTextInput}
                handleSendMessage={handleSendMessageWithScroll}
                handleImageUpload={() => {
                  // You may want to trigger a file input click here, or show a modal
                  // For now, just call the original handler with a dummy file or leave as a TODO
                  // TODO: Implement file picker and call handleImageUpload(file)
                }}
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
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
