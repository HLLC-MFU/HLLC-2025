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
      <button
        onClick={() => {
          if (!enrichedReplyTo.notFound && onReplyPreviewClick) {
            onReplyPreviewClick(enrichedReplyTo.id);
          }
        }}
        className="mb-2 max-w-[80%] flex flex-col items-start bg-white/70 rounded-xl px-4 py-2"
        type="button"
      >
        <span className="text-xs text-gray-500 mb-1">
          {isMyMessage
            ? `You replied to ${getDisplayName(enrichedReplyTo.user) || 'Unknown'}`
            : `${getDisplayName(message.user) || 'Someone'} replied to ${getDisplayName(enrichedReplyTo.user) || 'Unknown'}`}
        </span>
        <div className="flex flex-row items-center gap-2">
          {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType === 'image' && enrichedReplyTo.image && (
            <img src={enrichedReplyTo.image} alt="reply-img" className="w-9 h-9 rounded" />
          )}
          {enrichedReplyTo.type === 'sticker' && enrichedReplyTo.image && (
            <img src={enrichedReplyTo.image} alt="reply-sticker" className="w-9 h-9" />
          )}
          {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType !== 'image' && (
            <span className="text-xs text-gray-700 italic">{enrichedReplyTo.fileName}</span>
          )}
          {enrichedReplyTo.type === 'message' && (
            <span className="text-xs text-gray-700">{renderWithMentions(enrichedReplyTo.text || '', currentUsername)}</span>
          )}
          {enrichedReplyTo.notFound && (
            <span className="text-xs text-gray-400">[ไม่พบข้อความต้นฉบับ]</span>
          )}
        </div>
      </button>
    );
  }, [enrichedReplyTo, isMyMessage, message, onReplyPreviewClick, currentUsername, getDisplayName]);

  return (
    <div
      className={`my-3 max-w-full flex flex-col ${isMyMessage ? 'items-end ml-10' : 'items-start mr-10'}`}
      onContextMenu={handleLongPress}
    >
      {renderReplyPreview()}
      <div className="flex flex-row items-end w-full">
        {!isMyMessage && showAvatar && isLastInGroup ? (
          <Avatar name={getDisplayName(message.user)} size={32} />
        ) : (
          !isMyMessage && <div style={{ width: 40 }} />
        )}
        <div
          className={`max-w-[80%] min-w-[20px] px-5 py-3 rounded-2xl shadow-xl border border-white/30 backdrop-blur ${isMyMessage ? 'bg-gradient-to-br from-blue-400/60 to-blue-600/80 text-white' : 'bg-white/40 text-gray-900'} ${isMyMessage ? 'rounded-tr-md' : 'rounded-tl-md'} ${isFirstInGroup ? (isMyMessage ? 'rounded-tr-2xl' : 'rounded-tl-2xl') : ''} ${isLastInGroup ? (isMyMessage ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''} ${message.stickerId || message.image || message.fileType === 'image' ? 'p-1 bg-transparent' : ''}`}
        >
          {renderContent()}
        </div>
      </div>
      {isLastInGroup && (
        <div className={`flex flex-row items-center mt-1 ${isMyMessage ? 'justify-end' : 'ml-10'}`}>
          {!isMyMessage && message.user?.username && (
            <span className="text-xs text-blue-500 font-semibold mr-2">{message.user.username}</span>
          )}
          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
          {statusElement}
        </div>
      )}
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