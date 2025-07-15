import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useChatRoom } from '../../../hooks/chats/useChatRoom';
import { useProfile } from '@/hooks/useProfile';
import { ChatRoom } from '@/types/chat';
import ChatInput from '@/components/chats/ChatInput';
import ErrorView from '@/components/chats/ErrorView';
import JoinBanner from '@/components/chats/JoinBanner';
import MessageList from '@/components/chats/MessageList';
import RoomInfoModal from '@/components/chats/RoomInfoModal';
import EvoucherModal from '@/components/chats/EvoucherModal';
import StickerPicker from '@/components/chats/StickerPicker';
import MentionSuggestions from '@/components/chats/MentionSuggestions';
import { Users, Info, Loader, ChevronLeft } from 'lucide-react';

export default function ChatRoomPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const flatListRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showEvoucherModal, setShowEvoucherModal] = useState(false);
  const { user } = useProfile();

  const getRoomName = (room: any) => {
    if (!room?.name) return t('chat.chatRoom');
    const currentLang = i18n.language;
    if (currentLang === 'th' && room.name.th) {
      return room.name.th;
    } else if (currentLang === 'en' && room.name.en) {
      return room.name.en;
    }
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

  const canSendEvoucher = () => {
    // Adjust this logic to your user object structure
    return false;
  };
  const isAdminOrAE = canSendEvoucher();
  const shouldShowEvoucherButton = () => {
    return room?.type === 'readonly' && canSendEvoucher();
  };

  useEffect(() => {
    if (room && !loading) {
      loadMembers(1, false);
    }
  }, [room, loading, loadMembers]);

  const handleSendMessageWithScroll = () => {
    handleSendMessage();
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollTop = flatListRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 20;
    setShowScrollToBottom(!isAtBottom);
  };

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={initializeRoom} />;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-800 bg-gray-900">
        <button
          className="mr-4 p-2 rounded hover:bg-gray-800"
          onClick={() => router.replace('/chat')}
        >
          <ChevronLeft color="#fff" size={24} />
        </button>
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setIsRoomInfoVisible(true)}
        >
          <span className="text-lg font-semibold text-white truncate block">
            {getRoomName(room)}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Users size={14} color="#0A84FF" />
            <span className="text-xs text-blue-300">{room?.members_count} {t('chat.members')}</span>
          </div>
        </div>
        {shouldShowEvoucherButton() ? (
          <button
            className="ml-4 p-2 rounded hover:bg-gray-800"
            onClick={() => setShowEvoucherModal(true)}
          >
            <Info color="#0A84FF" size={20} />
          </button>
        ) : (
          <button
            className="ml-4 p-2 rounded hover:bg-gray-800"
            onClick={() => setIsRoomInfoVisible(true)}
          >
            <Info color="#0A84FF" size={20} />
          </button>
        )}
      </div>

      {/* Connection status indicator */}
      {wsError && (
        <div className="bg-red-100 text-red-700 p-2 text-center">
          {t('chat.connectionError')}
        </div>
      )}

      {/* Join Room Banner */}
      {!isMember && (
        <JoinBanner
          onJoin={handleJoin}
          joining={joining}
          roomCapacity={room?.capacity || 0}
          connectedCount={Array.isArray(room?.members_count) ? room.members_count : 0}
        />
      )}

      {/* Messages List */}
      <div className="flex-1 relative">
        <MessageList
          messages={groupMessages()}
          userId={userId}
          typing={typing}
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
            className="fixed bottom-20 right-8 bg-white/30 rounded-full px-4 py-2 text-white shadow-lg z-10"
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

      {/* Mention Suggestions */}
      {isMentioning && (
        <MentionSuggestions
          suggestions={mentionSuggestions}
          onSelect={handleMentionSelect}
        />
      )}

      {/* Input Area */}
      {room?.type === 'readonly' && !isAdminOrAE ? (
        <div className="bg-white/10 p-4 m-4 rounded-lg border border-white/20 text-center">
          <div className="text-white font-semibold text-lg">{t('chat.readonlyRoom')}</div>
          <div className="text-white/70 text-sm mt-1">{t('chat.readonlyMessage')}</div>
        </div>
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
    </div>
  );
}
