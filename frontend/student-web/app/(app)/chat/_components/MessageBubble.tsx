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
  stickers?: any[]; // <-- add stickers prop
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
  stickers = [], // <-- default empty
}: Omit<MessageBubbleEnrichedProps, 'senderId' | 'senderName'> & { onUnsend?: (message: any) => void, stickers?: any[] }) => {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [claimed, setClaimed] = useState<{ [id: string]: boolean }>({});
  const [claiming, setClaiming] = useState<{ [id: string]: boolean }>({});
  const [isHovered, setIsHovered] = useState(false);

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
    <div className="flex items-center ml-2 text-xs text-gray-500 dark:text-gray-400">
      {isRead ? (
        <>
          <svg className="w-3 h-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          อ่านแล้ว
        </>
      ) : (
        <>
          <svg className="w-3 h-3 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          ส่งแล้ว
        </>
      )}
    </div>
  ), [isMyMessage, isRead]);

  const lang = 'th';

  const getStickerImageUrl = useCallback((imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return `${IMAGE_BASE_URL}/uploads/${imagePath}`;
  }, []);

  const getMessageTextStyle = useCallback(() => (
    `text-[15.5px] leading-[1.5] ${!isMyMessage ? 'text-gray-900 dark:text-gray-100' : 'text-white'}`
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
            <span key={i} className="text-blue-400 font-semibold bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded-md">{part}</span>
          );
        }
        return <span key={i} className="text-blue-500 font-medium">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  }, []);

  // Always resolve sticker image from message or stickers list
  const stickerImageUrl = useMemo(() => {
    if (message.image) {
      if (message.image.startsWith('http')) return message.image;
      return `${CHAT_BASE_URL}/uploads/${message.image}`;
    }
    if (message.stickerId && stickers && stickers.length > 0) {
      const found = stickers.find(s => s.id === message.stickerId);
      if (found && found.image) {
        return `${CHAT_BASE_URL}/uploads/${found.image}`;
      }
    }
    return 'https://www.gravatar.com/avatar/?d=mp';
  }, [message.image, message.stickerId, stickers]);

  // In renderContent, always show sticker image for sticker messages
  const renderContent = useCallback(() => {
    if (message.type === 'evoucher' && message.evoucherInfo) {
      const isClaimed = claimed[message.id ?? ''] || false;
      const isClaiming = claiming[message.id ?? ''] || false;
      const displayLang = 'th';
      return (
        <div className={`rounded-xl border-2 p-4 my-2 min-w-[240px] max-w-[300px] transition-all duration-300 ${
          isClaimed 
            ? 'border-green-400/80 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30' 
            : 'border-yellow-400/80 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20'
        } shadow-md hover:shadow-lg hover:-translate-y-0.5`}>
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3 transform hover:scale-110 transition-transform duration-200">
              {isClaimed ? '🎉' : '🎟️'}
            </span>
            <span className={`font-bold text-sm ${
              isClaimed 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-yellow-700 dark:text-yellow-400'
            }`}>
              {message.evoucherInfo.message?.[displayLang] || ''}
            </span>
          </div>
          {isClaimed ? (
            <div className="mt-3 p-3 bg-green-100/70 dark:bg-green-900/40 rounded-lg text-green-700 dark:text-green-300 font-semibold text-center text-sm border border-green-200/50 dark:border-green-800/50">
              คุณได้รับ E-Voucher แล้ว!
            </div>
          ) : (
            <button
              className="mt-3 w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-semibold rounded-lg px-4 py-2.5 hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md text-sm transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isClaimed || isClaiming}
              onClick={() => setClaimed(prev => ({ ...prev, [message.id ?? '']: true }))}
            >
              {isClaiming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังดำเนินการ...
                </span>
              ) : 'กดเพื่อรับ E-Voucher'}
            </button>
          )}
        </div>
      );
    }
    
    // Sticker message: always show sticker image
    if (message.type === 'sticker' || message.stickerId) {
      return (
        <button 
          className="bg-transparent p-0 border-0 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 animate-fadein"
          onClick={() => handleOpenImagePreview(stickerImageUrl)} 
          onContextMenu={handleLongPress}
          style={{ animation: message.isTemp ? 'fadeIn 0.5s' : undefined }}
        >
          <img
            src={stickerImageUrl}
            alt="sticker"
            className="w-28 h-28 rounded-xl bg-white/40 shadow-md object-contain"
            onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
          />
        </button>
      );
    }
    
    if (message.fileUrl) {
      const isImage = message.fileType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileUrl || '');
      if (isImage) {
        return (
          <button 
            className="bg-transparent p-0 border-0 rounded-xl hover:scale-[1.02] transition-transform duration-200 shadow-sm hover:shadow-md" 
            onClick={() => handleOpenImagePreview(message.fileUrl || '')} 
            onContextMenu={handleLongPress}
          >
            <img
              src={message.fileUrl || ''}
              alt="file"
              className="w-56 h-56 rounded-xl object-cover bg-gray-100 dark:bg-gray-800"
              onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
            />
          </button>
        );
      }
      return (
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200" onContextMenu={handleLongPress}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{message.fileName}</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className={getMessageTextStyle()}>
        {renderWithMentions(message.text || '', currentUsername)}
      </div>
    );
  }, [message, claimed, claiming, handleOpenImagePreview, handleLongPress, stickerImageUrl, getMessageTextStyle, renderWithMentions, currentUsername, stickers, getStickerImageUrl]);

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
    
    const isReplyingToSelf = enrichedReplyTo.user?._id === message.user?._id;
    
    return (
      <div 
        className={`w-full flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1.5`}
        onClick={(e) => {
          e.stopPropagation();
          if (enrichedReplyTo.id && onReplyPreviewClick) {
            onReplyPreviewClick(enrichedReplyTo.id);
          }
        }}
      >
        <div 
          className={`max-w-[85%] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 border ${
            isMyMessage 
              ? 'border-blue-200/80 dark:border-blue-900/60 hover:border-blue-300/80 dark:hover:border-blue-800/80' 
              : 'border-gray-200/80 dark:border-gray-700/60 hover:border-gray-300/80 dark:hover:border-gray-600/80'
          } cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md`}
        >
          <div className="flex items-center text-xs font-medium mb-1.5">
            <svg 
              className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${
                isMyMessage ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className={`truncate ${
              isMyMessage 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              {isMyMessage 
                ? `Replying to ${isReplyingToSelf ? 'yourself' : getDisplayName(enrichedReplyTo.user) || 'user'}`
                : `${getDisplayName(message.user) || 'Someone'} replied to ${isReplyingToSelf ? 'themselves' : getDisplayName(enrichedReplyTo.user) || 'you'}`}
            </span>
          </div>
          <div className={`text-sm truncate pl-4 border-l-2 ${
            isMyMessage 
              ? 'border-blue-200 dark:border-blue-800 text-gray-700 dark:text-gray-200' 
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {enrichedReplyTo.notFound ? (
              <span className="text-gray-400 dark:text-gray-500 italic text-xs">[Message not found]</span>
            ) : (
              <div className="space-y-1.5">
                {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType?.startsWith('image/') ? (
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 ${
                      isMyMessage ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <span className="text-sm truncate">
                      {enrichedReplyTo.fileName || 'Image'}
                    </span>
                  </div>
                ) : enrichedReplyTo.type === 'file' && !enrichedReplyTo.fileType?.startsWith('image/') ? (
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 ${
                      isMyMessage ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <span className="text-sm truncate">
                      {enrichedReplyTo.fileName || 'File'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm line-clamp-2">
                    {renderWithMentions(enrichedReplyTo.text || '', currentUsername) || 'Empty message'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [enrichedReplyTo, isMyMessage, message.user, getDisplayName, currentUsername, renderWithMentions]);

  return (
    <div className={`w-full flex flex-col ${isMyMessage ? 'items-end ml-12' : 'items-start mr-12'} mb-2`}>
      <div className={`flex items-end ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isMyMessage && (
          <Avatar
            name={getDisplayName(message.user || { name: { first: '', last: '' } })}
            size={36}
          />
        )}
        <div className={`flex flex-col max-w-[80%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
          {/* Username */}
          {!isMyMessage && (
            <span className="text-xs font-semibold text-gray-800 mb-1 ml-1">{message.user?.username}</span>
          )}
          {/* Sticker rendering (outside bubble) */}
          {((message.type === 'sticker' || message.stickerId) && stickerImageUrl) ? (
            <button 
              className="bg-transparent p-0 border-0 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 animate-fadein"
              onClick={() => handleOpenImagePreview(stickerImageUrl)} 
              onContextMenu={handleLongPress}
              style={{ animation: message.isTemp ? 'fadeIn 0.5s' : undefined }}
            >
              <img
                src={stickerImageUrl}
                alt="sticker"
                className="w-28 h-28 object-contain rounded-xl shadow"
                draggable={false}
                onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
              />
            </button>
          ) : (
            <div
              className={
                `px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out ` +
                (isMyMessage
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg rounded-br-sm'
                  : 'bg-white text-gray-900 shadow border border-gray-100 rounded-bl-sm') +
                ' hover:shadow-md hover:-translate-y-0.5'
              }
              style={{ wordBreak: 'break-word' }}
            >
              {/* Render message text with mention highlight */}
              {renderWithMentions(message.text || '', currentUsername)}
            </div>
          )}
          {/* Date/time under bubble */}
          <span className="text-xs font-medium text-gray-600 mt-1 ml-2">{formatTime(message.timestamp)}</span>
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