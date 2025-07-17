import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import Avatar from './Avatar';
import { MessageBubbleProps } from '@/types/chat';
import { CHAT_BASE_URL, API_BASE_URL, IMAGE_BASE_URL } from '@/configs/chats/chatConfig';
import { formatTime } from '@/utils/chats/timeUtils';
import ImagePreviewModal from './ImagePreviewModal';

interface MessageBubbleEnrichedProps extends MessageBubbleProps {
  allMessages?: any[];
  onReplyPreviewClick?: (replyToId: string) => void;
  currentUsername: string;
}

const MessageBubble = memo(({ 
  message, 
  isMyMessage, 
  isRead,
  showAvatar = true,
  isLastInGroup = true,
  isFirstInGroup = true,
  onReply,
  allMessages = [],
  onReplyPreviewClick,
  currentUsername,
  onUnsend,
}: Omit<MessageBubbleEnrichedProps, 'senderId' | 'senderName'> & { onUnsend?: (message: any) => void }) => {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [claimed, setClaimed] = useState<{ [id: string]: boolean }>({});
  const [claiming, setClaiming] = useState<{ [id: string]: boolean }>({});

  const handleCloseImagePreview = useCallback(() => {
    setShowImagePreview(false);
    setTimeout(() => setPreviewImageUrl(''), 100);
  }, []);

  const handleOpenImagePreview = useCallback((imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
  }, []);

  useEffect(() => {
    // DEBUG: log message object to console
    console.log('[DEBUG][MessageBubble] message:', message);
  }, [message]);

  useEffect(() => () => {
    setShowImagePreview(false);
    setPreviewImageUrl('');
  }, []);

  const handleLongPress = useCallback(() => {
    const isDeleted = Boolean((message as any).isDeleted);
    if (isMyMessage && !isDeleted && onUnsend) {
      if (window.confirm('Do you want to unsend this message?')) {
        onUnsend(message);
      }
    }
  }, [isMyMessage, message, onUnsend]);

  const statusElement = useMemo(() => isMyMessage && (
    <div className="ml-2 text-xs text-gray-400">{isRead ? 'อ่านแล้ว' : 'ส่งแล้ว'}</div>
  ), [isMyMessage, isRead]);

  const lang = 'th';

  const getStickerImageUrl = useCallback((imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  }, []);

  const getMessageTextStyle = useCallback(() => (
    `text-base ${!isMyMessage ? 'text-black' : 'text-white'}`
  ), [isMyMessage]);

  const renderWithMentions = useCallback((text: string, currentUsername: string) => {
    if (!text) return null;
    const regex = /(@\w+)/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        const mention = part.slice(1);
        const isMatch = mention === currentUsername;
        if (isMatch) {
          return (
            <span key={i} className="text-blue-500 font-bold">{part}</span>
          );
        }
        return <span key={i}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  }, []);

  const renderContent = useCallback(() => {
    if (message.type === 'evoucher' && message.evoucherInfo) {
      const isClaimed = claimed[message.id ?? ''] || false;
      const isClaiming = claiming[message.id ?? ''] || false;
      // Always use 'th' for displayLang
      const displayLang = 'th';
      return (
        <div className={`rounded-xl border-2 p-4 my-2 min-w-[220px] max-w-[300px] ${isClaimed ? 'border-green-500 bg-green-50/10' : 'border-yellow-400 bg-yellow-50/10'}`}>
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">{isClaimed ? '🎉' : '🎟️'}</span>
            <span className={`font-bold ${isClaimed ? 'text-green-500' : 'text-yellow-700'}`}>{message.evoucherInfo.message?.[displayLang] || ''}</span>
          </div>
          {isClaimed ? (
            <div className="mt-2 p-2 bg-green-100/20 rounded text-green-600 font-bold text-center">คุณได้รับ E-Voucher แล้ว!</div>
          ) : (
            <button
              className="mt-2 bg-yellow-400 text-yellow-900 font-bold rounded px-4 py-2 hover:bg-yellow-300 transition"
              disabled={isClaimed || isClaiming}
              onClick={() => setClaimed(prev => ({ ...prev, [message.id ?? '']: true }))}
            >
              {isClaiming ? 'กำลังเคลม...' : 'กดเพื่อรับ E-Voucher'}
            </button>
          )}
        </div>
      );
    }
    if (message.image && (message.type === 'sticker' || message.stickerId)) {
      const imageUrl = getStickerImageUrl(message.image);
      return (
        <button className="bg-transparent p-0 border-0" onClick={() => handleOpenImagePreview(imageUrl)} onContextMenu={handleLongPress}>
          <img
            src={imageUrl}
            alt="sticker"
            className="w-28 h-28 rounded-lg bg-transparent"
            onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
          />
        </button>
      );
    }
    if (message.fileUrl) {
      const isImage = message.fileType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileUrl || '');
      if (isImage) {
        return (
          <button className="bg-transparent p-0 border-0" onClick={() => handleOpenImagePreview(message.fileUrl || '')} onContextMenu={handleLongPress}>
            <img
              src={message.fileUrl || ''}
              alt="file"
              className="w-52 h-52 rounded-xl bg-gray-900"
              onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
            />
          </button>
        );
      }
      return (
        <div className="p-2 bg-gray-100 rounded-lg" onContextMenu={handleLongPress}>
          <span className="text-gray-800 italic text-sm">{message.fileName}</span>
        </div>
      );
    }
    return <span className={getMessageTextStyle()}>{renderWithMentions(message.text || '', currentUsername)}</span>;
  }, [message, claimed, claiming, handleOpenImagePreview, handleLongPress, getStickerImageUrl, getMessageTextStyle, renderWithMentions, currentUsername]);

  const enrichedReplyTo = useMemo(() => {
    const replyTo = message.replyTo || undefined;
    if (replyTo && replyTo.id) {
      const found = allMessages.find(m => m.id === replyTo.id);
      if (found) {
        return {
          ...replyTo,
          type: found.type,
          text: found.text || '',
          image: found.image,
          fileName: found.fileName,
          fileType: found.fileType,
          stickerId: found.stickerId,
          user: found.user,
        };
      }
      return { ...replyTo, notFound: true };
    }
    return replyTo;
  }, [message.replyTo?.id, message.replyTo?.text, allMessages, message.replyTo]);

  const getDisplayName = useCallback((user?: { name?: { first?: string; last?: string } }) => {
    if (!user || !user.name) return '';
    return `${user.name.first || ''} ${user.name.last || ''}`.trim();
  }, []);

  const renderReplyPreview = useCallback(() => {
    if (!enrichedReplyTo) return null;
    return (
      <div className={`w-full flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1`}>
        <div 
          className={`max-w-[85%] bg-white/20 dark:bg-gray-700/50 rounded-lg p-2 border-l-4 ${
            isMyMessage ? 'border-blue-400' : 'border-gray-400'
          }`}
        >
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            {isMyMessage 
              ? `Replying to ${getDisplayName(enrichedReplyTo.user) || 'yourself'}`
              : `${getDisplayName(message.user) || 'Someone'} replied to ${getDisplayName(enrichedReplyTo.user) || 'you'}`}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {enrichedReplyTo.notFound ? (
              <span className="text-gray-400">[Message not found]</span>
            ) : (
              <>
                {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType === 'image' && enrichedReplyTo.image && (
                  <div className="flex items-center">
                    <img src={enrichedReplyTo.image} alt="" className="w-4 h-4 mr-1" />
                    <span>Photo</span>
                  </div>
                )}
                {enrichedReplyTo.type === 'sticker' && enrichedReplyTo.image && (
                  <div className="flex items-center">
                    <span className="mr-1">🎨</span>
                    <span>Sticker</span>
                  </div>
                )}
                {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType !== 'image' && (
                  <span className="italic">{enrichedReplyTo.fileName || 'File'}</span>
                )}
                {(enrichedReplyTo.type === 'message' || !enrichedReplyTo.type) && (
                  <span>{renderWithMentions(enrichedReplyTo.text || '', currentUsername) || 'Empty message'}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, [enrichedReplyTo, isMyMessage, message.user, getDisplayName, currentUsername, renderWithMentions]);

  return (
    <div
      className={`w-full flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} ${
        isFirstInGroup ? 'mt-2' : 'mt-0.5'
      }`}
      onContextMenu={handleLongPress}
    >
      {renderReplyPreview()}
      <div className="flex items-start w-full">
        {!isMyMessage && showAvatar && (
          <div 
            className="flex-shrink-0 mr-2 self-end transition-opacity duration-200"
            style={{ opacity: isLastInGroup ? 1 : 0 }}
          >
            <Avatar 
              name={getDisplayName(message.user)} 
              size={32}
            />
          </div>
        )}
        <div className="flex flex-col max-w-[85%]">
          {!isMyMessage && message.user?.username && isFirstInGroup && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 ml-1">
              {message.user.username}
            </span>
          )}
          <div
            className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
              isMyMessage 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
            } ${
              message.type === 'sticker' || message.stickerId 
                ? 'bg-transparent shadow-none p-1' 
                : 'border border-opacity-20 dark:border-opacity-30 ' + 
                  (isMyMessage ? 'border-blue-400' : 'border-gray-200 dark:border-gray-600')
            }`}
          >
            {renderContent()}
          </div>
          {isLastInGroup && (
            <div className={`flex flex-row items-center mt-1 ${isMyMessage ? 'justify-end' : 'ml-1'}`}>
              <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
              {statusElement}
            </div>
          )}
        </div>
      </div>
      <ImagePreviewModal
        key={previewImageUrl}
        visible={showImagePreview}
        imageUrl={previewImageUrl}
        onClose={handleCloseImagePreview}
      />
    </div>
  );
});

export default MessageBubble; 