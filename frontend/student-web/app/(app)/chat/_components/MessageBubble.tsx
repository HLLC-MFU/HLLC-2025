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
    return `${API_BASE_URL}/uploads/${imagePath}`;
  }, []);

  const getMessageTextStyle = useCallback(() => (
    `text-[15px] leading-[1.33] ${!isMyMessage ? 'text-gray-900 dark:text-gray-100' : 'text-white'}`
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

  const renderContent = useCallback(() => {
    if (message.type === 'evoucher' && message.evoucherInfo) {
      const isClaimed = claimed[message.id ?? ''] || false;
      const isClaiming = claiming[message.id ?? ''] || false;
      const displayLang = 'th';
      return (
        <div className={`rounded-xl border-2 p-4 my-2 min-w-[220px] max-w-[300px] transition-all duration-200 ${
          isClaimed 
            ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20' 
            : 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20'
        }`}>
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">{isClaimed ? '🎉' : '🎟️'}</span>
            <span className={`font-bold text-sm ${isClaimed ? 'text-green-600 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
              {message.evoucherInfo.message?.[displayLang] || ''}
            </span>
          </div>
          {isClaimed ? (
            <div className="mt-3 p-3 bg-green-200/50 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-300 font-semibold text-center text-sm">
              คุณได้รับ E-Voucher แล้ว!
            </div>
          ) : (
            <button
              className="mt-3 w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-semibold rounded-lg px-4 py-2.5 hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
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
        <button 
          className="bg-transparent p-0 border-0 rounded-lg hover:scale-105 transition-transform duration-200" 
          onClick={() => handleOpenImagePreview(imageUrl)} 
          onContextMenu={handleLongPress}
        >
          <img
            src={imageUrl}
            alt="sticker"
            className="w-32 h-32 rounded-lg bg-transparent shadow-sm"
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
    
    const replyText = enrichedReplyTo.text || (enrichedReplyTo.image ? 'Image' : 'File');
    const isReplyingToSelf = enrichedReplyTo.user?._id === message.user?._id;
    
    return (
      <div 
        className={`w-full flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1`}
        onClick={(e) => {
          e.stopPropagation();
          if (enrichedReplyTo.id && onReplyPreviewClick) {
            onReplyPreviewClick(enrichedReplyTo.id);
          }
        }}
      >
        <div 
          className={`max-w-[85%] bg-blue-50/70 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 ${
            isMyMessage ? 'border-blue-400' : 'border-gray-400'
          } cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/30 transition-all duration-200 shadow-sm`}
        >
          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium mb-1.5">
            <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="truncate">
              {isMyMessage 
                ? `Replying to ${isReplyingToSelf ? 'yourself' : getDisplayName(enrichedReplyTo.user) || 'user'}`
                : `${getDisplayName(message.user) || 'Someone'} replied to ${isReplyingToSelf ? 'themselves' : getDisplayName(enrichedReplyTo.user) || 'you'}`}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate pl-4 border-l-2 border-blue-200 dark:border-blue-700">
            {enrichedReplyTo.notFound ? (
              <span className="text-gray-400 italic">[Message not found]</span>
            ) : (
              <>
                {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType?.startsWith('image/') && (
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-4 h-4 mr-1.5 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <span className="text-gray-500 text-sm">
                      {enrichedReplyTo.fileName || 'Image'}
                    </span>
                  </div>
                )}
                {enrichedReplyTo.type === 'file' && !enrichedReplyTo.fileType?.startsWith('image/') && (
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-4 h-4 mr-1.5 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {enrichedReplyTo.fileName || 'File'}
                    </span>
                  </div>
                )}
                {enrichedReplyTo.text && (
                  <span className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                    {enrichedReplyTo.text}
                  </span>
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
        isFirstInGroup ? 'mt-4' : 'mt-1'
      }`}
      onContextMenu={handleLongPress}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderReplyPreview()}
      <div className={`flex items-start w-full ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMyMessage && showAvatar && (
          <div 
            className={`flex-shrink-0 ${isMyMessage ? 'ml-2' : 'mr-3'} self-end transition-all duration-200`}
            style={{ opacity: isLastInGroup ? 1 : 0 }}
          >
            <Avatar 
              name={getDisplayName(message.user)} 
              size={32}
            />
          </div>
        )}
        <div className={`flex flex-col max-w-[85%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
          {!isMyMessage && message.user?.username && isFirstInGroup && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1 font-medium">
              {message.user.username}
            </span>
          )}
          <div
            className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
              isMyMessage 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20' 
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
            } ${
              isMyMessage 
                ? 'rounded-br-md' 
                : 'rounded-bl-md'
            } ${
              message.type === 'sticker' || message.stickerId 
                ? 'bg-transparent shadow-none p-2' 
                : 'hover:shadow-md'
            } ${
              isHovered ? 'scale-[1.01]' : ''
            }`}
          >
            {renderContent()}
          </div>
          {isLastInGroup && (
            <div className={`flex flex-row items-center mt-1.5 ${isMyMessage ? 'justify-end' : 'ml-1'}`}>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {formatTime(message.timestamp)}
              </span>
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