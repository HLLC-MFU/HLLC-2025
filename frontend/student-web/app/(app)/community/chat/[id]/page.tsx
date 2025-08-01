'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useChatRoom } from '@/hooks/chats/useChatRoom';
import { useProfile } from '@/hooks/useProfile';
import { ChatRoom } from '@/types/chat';
import ChatInput from '@/app/(app)/community/chat/_components/ChatInput';
import ErrorView from '@/app/(app)/community/chat/_components/ErrorView';
import JoinBanner from '@/app/(app)/community/chat/_components/JoinBanner';
import MessageList from '@/app/(app)/community/chat/_components/MessageList';
import RoomInfoModal from '@/app/(app)/community/chat/_components/RoomInfoModal';
import EvoucherModal from '@/app/(app)/community/chat/_components/EvoucherModal';
import StickerPicker from '@/app/(app)/community/chat/_components/StickerPicker';
import { Users, Info, Loader, ChevronLeft } from 'lucide-react';

export default function ChatRoomPage() {
  const params = useParams();

  const router = useRouter();
  const { t, i18n } = useTranslation();
  const flatListRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showEvoucherModal, setShowEvoucherModal] = useState(false);
  const { user } = useProfile();
  const [localSystemMessages, setLocalSystemMessages] = useState<any[][]>([]);

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
    isRoomInfoVisible,
    setIsRoomInfoVisible,
    replyTo,
    setReplyTo,
    showStickerPicker,
    setShowStickerPicker,
    isConnected,
    wsError,
    inputRef,
    userId,
    roomId,
    groupMessages,
    mentionSuggestions,
    isMentioning,
    members,
    handleJoin,
    handleSendMessage,
    handleSendSticker,
    handleMentionSelect,
    handleTextInput,
    initializeRoom,
    loadMembers,
    handleUnsendMessage,
    stickers,
    messagesLoading,
  } = chatRoom;

  const canSendEvoucher = () => {
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
  }, [room, loading, loadMembers, params]);

  const handleSendMessageWithScroll = () => {
    console.log('[DEBUG] handleSendMessageWithScroll called', { isMember, isConnected, messageText });
    if (messageText.trim() && isConnected) {
      handleSendMessage();
      // REMOVE: Do not add local feedback system message for Fresher in MC room
      // if (room?.type === 'mc' && user?.role?.name === 'Fresher') {
      //   const sysMsg = {
      //     id: `sys-feedback-${Date.now()}`,
      //     type: 'system',
      //     text: 'ขอบคุณสำหรับคำถามของคุณ /n Thank you for your feedback',
      //     timestamp: new Date().toISOString(),
      //   };
      //   setLocalSystemMessages((prev) => [...prev, [sysMsg]]);
      // }
      setMessageText('');
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollTop = flatListRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    if (user.name) {
      const name = user.name;
      if (typeof name === 'string') return name;
      if (name.first || name.last) return `${name.first || ''} ${name.last || ''}`.trim();
    }
    return user.username || 'User';
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 20;
    setShowScrollToBottom(!isAtBottom);
  };

  if (loading) return (
    <div className="fixed inset-0 flex flex-col w-full h-full bg-black/40 backdrop-blur-xl">
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex justify-between w-full h-full bg-[#1212124d] backdrop-blur-lg flex flex-col overflow-hidden animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center pt-8 p-4 border-b border-[#2A2A2A] bg-[#1212124d]">
            <div className="mr-4 h-8 w-8 bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-6 w-1/3 bg-gray-600 rounded mb-2" />
              <div className="h-4 w-1/4 bg-gray-500 rounded" />
            </div>
          </div>

          {/* Input Skeleton */}
          <div className="border border-white/40 bg-white/20 my-4 mx-2 rounded-3xl backdrop-blur-lg p-4">
            <div className="max-w-2xl mx-auto flex items-center justify-end gap-2">
              <div className="h-10 w-10 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return <ErrorView message={error} onRetry={initializeRoom} />;

  return (
    <div className="fixed inset-0 flex flex-col w-full h-full min-h-screen">
      <div className="w-full h-full flex justify-center items-center">
        <div className="w-full h-full bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center p-4 border-b border-[#2A2A2A] bg-[#1212124d]">
            <ChevronLeft color="white" size={24} className="mr-4" onClick={() => router.back()} />
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setIsRoomInfoVisible(true)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg text-white font-semibold text-gray-900 truncate block drop-shadow">
                  {room ? getRoomName(room) : t('chat.chatRoom')}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Users size={14} color="#0a5cffff" />
                <span className="text-sm text-default-400">{room?.members_count || 0} {t('chat.member')}</span>
              </div>
            </div>
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
                roomStatus={room?.status}
                roomType={room?.type}
              />
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 relative bg-black/20 w-full h-full overflow-hidden">
            <div className="absolute inset-0 w-full h-full flex flex-col justify-end">
              <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Reply Preview */}
                {replyTo && (
                  <div className="mx-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-blue-600">
                            Replying to {String(replyTo.user?._id) === String(userId) ? 'yourself' : getDisplayName(replyTo.user)}
                          </span>
                          <button
                            onClick={() => setReplyTo(undefined)}
                            className="text-gray-400 hover:text-gray-600 p-1 -mr-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Cancel reply"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {typeof replyTo.text === 'string'
                            ? replyTo.text
                            : replyTo.type === 'evoucher'
                              ? 'E-Voucher'
                              : replyTo.type === 'sticker'
                                ? 'Sticker'
                                : replyTo.type === 'file'
                                  ? 'File'
                                  : 'Photo or file'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <MessageList
                  messages={[...groupMessages, ...localSystemMessages]}
                  userId={userId}
                  currentUsername={user?.username || ''}
                  flatListRef={flatListRef}
                  onReply={setReplyTo}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onUnsend={handleUnsendMessage}
                  stickers={stickers}
                  loading={messagesLoading}
                  room={room}
                  user={user}
                />
                {showScrollToBottom && (
                  <button
                    className={`fixed ${replyTo ? 'bottom-40' : 'bottom-28'} right-6 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-blue-700 shadow-lg z-10 transition-all duration-200 flex items-center gap-2 border border-blue-100 hover:shadow-md`}
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                    onClick={() => {
                      if (flatListRef.current) {
                        flatListRef.current.scrollTop = flatListRef.current.scrollHeight;
                      }
                    }}
                  >
                    <svg className="w-4 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <ChatInput
            messageText={messageText}
            handleTextInput={handleTextInput}
            handleSendMessage={handleSendMessageWithScroll}
            isMember={isMember}
            isConnected={isConnected}
            inputRef={inputRef}
            setShowStickerPicker={setShowStickerPicker}
            showStickerPicker={showStickerPicker}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            mentionSuggestions={mentionSuggestions}
            isMentioning={isMentioning}
            handleMentionSelect={handleMentionSelect}
            room={room}
          />
        </div>
      </div>

      {/* StickerPicker modal - only show if not MC room */}
      {showStickerPicker && room?.type !== 'mc' && (
        <StickerPicker
          onSelectSticker={handleSendSticker}
          onClose={() => setShowStickerPicker(false)}
        />
      )}

      <EvoucherModal
        roomId={roomId}
        isVisible={showEvoucherModal}
        onClose={() => setShowEvoucherModal(false)}
        onSuccess={() => {
          console.log('Evoucher sent successfully');
        }}
      />
    </div>
  );
}
