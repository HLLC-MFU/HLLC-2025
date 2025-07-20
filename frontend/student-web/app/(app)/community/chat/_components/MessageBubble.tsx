import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import Avatar from './Avatar';
import { MessageBubbleProps } from '@/types/chat';
import { CHAT_BASE_URL, API_BASE_URL, IMAGE_BASE_URL } from '@/configs/chats/chatConfig';
import { formatTime } from '@/utils/chats/timeUtils';
import ImagePreviewModal from './ImagePreviewModal';
import { useResponsiveText } from '@/hooks/useResponsiveText';

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
  onReply,
  allMessages = [],
  onReplyPreviewClick,
  currentUsername,
  onUnsend,
  stickers = [], // <-- default empty
}: Omit<MessageBubbleEnrichedProps, 'senderId' | 'senderName'> & { onUnsend?: (message: any) => void, stickers?: any[] }) => {
  const { splitTextIntoChunks } = useResponsiveText();
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [claimed, setClaimed] = useState<{ [id: string]: boolean }>({});
  const [claiming, setClaiming] = useState<{ [id: string]: boolean }>({});
  const [showUnsendButton, setShowUnsendButton] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  // Debug showClaimDialog state changes
  useEffect(() => {
    console.log('[DEBUG] showClaimDialog state changed:', showClaimDialog);
  }, [showClaimDialog]);
  const [claimDialogMessage, setClaimDialogMessage] = useState('');
  const [claimDialogType, setClaimDialogType] = useState<'success' | 'error' | 'info'>('info');
  const [showMysteryValues, setShowMysteryValues] = useState(false);
  
  const handleCloseImagePreview = useCallback(() => {
    setShowImagePreview(false);
    setTimeout(() => setPreviewImageUrl(''), 100);
  }, []);

  const handleOpenImagePreview = useCallback((imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
  }, []);

  const showDialog = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setClaimDialogMessage(message);
    setClaimDialogType(type);
    setShowClaimDialog(true);
    // Auto hide after 3 seconds
    setTimeout(() => setShowClaimDialog(false), 3000);
  }, []);

  useEffect(() => {
    // DEBUG: log message object to console
    console.log('[DEBUG][MessageBubble] message:', message);
  }, [message]);

  useEffect(() => () => {
    setShowImagePreview(false);
    setPreviewImageUrl('');
  }, []);

  const handleUnsend = useCallback(() => {
    const isDeleted = Boolean((message as any).isDeleted);
    if (isMyMessage && !isDeleted && onUnsend) {
      if (window.confirm('Do you want to unsend this message?')) {
        onUnsend(message);
      }
    }
  }, [isMyMessage, message, onUnsend]);

  const handleMouseEnter = useCallback(() => {
    if (isMyMessage) {
      setShowUnsendButton(true);
    }
  }, [isMyMessage]);

  const handleMouseLeave = useCallback(() => {
    setShowUnsendButton(false);
  }, []);

  const getStickerImageUrl = useCallback((imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return `${IMAGE_BASE_URL}/uploads/${imagePath}`;
  }, []);

  const getMessageTextStyle = useCallback(() => (
    `text-[15.5px] leading-[1.5] ${!isMyMessage ? 'text-gray-900 dark:text-gray-100' : 'text-white'}`
  ), [isMyMessage]);

  const renderWithMentions = useCallback((text: string, currentUsername: string, isReplyPreview = false) => {
    if (!text || typeof text !== 'string') return null;
    
    const textChunks = splitTextIntoChunks(text);
    
    return textChunks.map((chunk, chunkIndex) => {
    const regex = /(@\w+)/g;
      const parts = chunk.split(regex);
      
              return (
          <div key={chunkIndex} className="block mb-1 last:mb-0">
            {parts.map((part, i) => {
      if (regex.test(part)) {
        const mention = part.slice(1);
        const isMatch = mention === currentUsername;
        if (isMatch) {
          // Highlight current user mention with better contrast for my-message
          return (
            <span key={i} className={`inline font-semibold px-1.5 py-0.5 rounded-md ${
              isReplyPreview 
                ? 'text-blue-400' 
                : isMyMessage 
                ? 'text-yellow-200 bg-yellow-600/30' 
                : 'text-blue-400'
            }`}>
              {part}
            </span>
          );
        }
        // Other mentions with better contrast for my-message
        return (
          <span key={i} className={`inline font-medium px-1 py-0.5 rounded ${
            isReplyPreview 
              ? 'text-blue-500' 
              : isMyMessage 
              ? 'text-cyan-200 bg-cyan-600/30' 
              : 'text-blue-500'
          }`}>
            {part}
          </span>
        );
      }
      return <span key={i} className="inline">{part}</span>;
          })}
        </div>
      );
    });
  }, [isMyMessage, splitTextIntoChunks]);

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
    // Handle join/leave system messages as special bubbles
    if (message.type === 'join' || message.type === 'leave') {
      const userName = message.user?.username || message.username || 'Someone';
      const actionText = message.type === 'join' ? 'joined the room' : 'left the room';
      const emoji = message.type === 'join' ? '🎉' : '👋';
      const bgColor = message.type === 'join' ? 'bg-green-50/80 dark:bg-green-900/20' : 'bg-gray-50/80 dark:bg-gray-800/20';
      const borderColor = message.type === 'join' ? 'border-green-200/50 dark:border-green-700/30' : 'border-gray-200/50 dark:border-gray-700/30';
      const textColor = message.type === 'join' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-300';
      
      return (
        <div className={`${bgColor} backdrop-blur-sm rounded-2xl border ${borderColor} shadow-sm w-full max-w-sm p-4`}>
          <div className="flex items-center justify-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full ${message.type === 'join' ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'} flex items-center justify-center`}>
                <span className="text-xl">{emoji}</span>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className={`${textColor} font-medium text-sm`}>
                <span className="font-semibold">{userName}</span>
                <br />
                <span className="text-xs opacity-75">{actionText}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle restriction system messages (ban, unban, mute, unmute, kick)
    if (message.type === 'restriction') {
      const action = message.subType || 'action';
      const restrictionText = message.text || '';
      
      // Define colors and emojis for different restriction types
      const getRestrictionStyle = (action: string) => {
        switch (action) {
          case 'ban':
            return {
              emoji: '🚫',
              bgColor: 'bg-red-50/80 dark:bg-red-900/20',
              borderColor: 'border-red-200/50 dark:border-red-700/30',
              textColor: 'text-red-700 dark:text-red-300',
              iconBg: 'bg-red-100 dark:bg-red-800'
            };
          case 'unban':
            return {
              emoji: '✅',
              bgColor: 'bg-green-50/80 dark:bg-green-900/20',
              borderColor: 'border-green-200/50 dark:border-green-700/30',
              textColor: 'text-green-700 dark:text-green-300',
              iconBg: 'bg-green-100 dark:bg-green-800'
            };
          case 'mute':
            return {
              emoji: '🔇',
              bgColor: 'bg-orange-50/80 dark:bg-orange-900/20',
              borderColor: 'border-orange-200/50 dark:border-orange-700/30',
              textColor: 'text-orange-700 dark:text-orange-300',
              iconBg: 'bg-orange-100 dark:bg-orange-800'
            };
          case 'unmute':
            return {
              emoji: '🔊',
              bgColor: 'bg-blue-50/80 dark:bg-blue-900/20',
              borderColor: 'border-blue-200/50 dark:border-blue-700/30',
              textColor: 'text-blue-700 dark:text-blue-300',
              iconBg: 'bg-blue-100 dark:bg-blue-800'
            };
          case 'kick':
            return {
              emoji: '👢',
              bgColor: 'bg-purple-50/80 dark:bg-purple-900/20',
              borderColor: 'border-purple-200/50 dark:border-purple-700/30',
              textColor: 'text-purple-700 dark:text-purple-300',
              iconBg: 'bg-purple-100 dark:bg-purple-800'
            };
          default:
            return {
              emoji: '⚠️',
              bgColor: 'bg-gray-50/80 dark:bg-gray-800/20',
              borderColor: 'border-gray-200/50 dark:border-gray-700/30',
              textColor: 'text-gray-600 dark:text-gray-300',
              iconBg: 'bg-gray-100 dark:bg-gray-700'
            };
        }
      };

      const style = getRestrictionStyle(action);
      
      return (
        <div className={`${style.bgColor} backdrop-blur-sm rounded-2xl border ${style.borderColor} shadow-sm w-full max-w-md p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center`}>
                <span className="text-xl">{style.emoji}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className={`${style.textColor} font-medium text-sm leading-relaxed`}>
                {restrictionText}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (message.type === 'evoucher') {
      // Debug logging for evoucher message processing
      console.log('[DEBUG][MessageBubble] 🔄 Processing evoucher message:', {
        messageId: message.id,
        messageType: message.type,
        hasPayload: !!message.payload,
        hasEvoucherInfo: !!message.evoucherInfo,
        messageKeys: Object.keys(message),
        payloadKeys: message.payload ? Object.keys(message.payload) : []
      });

      // Get evoucherInfo from multiple possible sources
      const evoucherInfo = message.evoucherInfo || (message.payload && message.payload.evoucherInfo) || {};
      
      console.log('[DEBUG][MessageBubble] ✅ Selected evoucher info:', {
        source: message.evoucherInfo ? 'direct' : (message.payload && message.payload.evoucherInfo ? 'payload' : 'none'),
        hasClaimUrl: !!(evoucherInfo as any).claimUrl,
        hasMessage: !!(evoucherInfo as any).message,
        hasSponsorImage: !!(evoucherInfo as any).sponsorImage,
        keys: Object.keys(evoucherInfo)
      });

            if (evoucherInfo && Object.keys(evoucherInfo).length > 0) {
        const isClaimed = claimed[message.id ?? ''] || false;
        const isClaiming = claiming[message.id ?? ''] || false;
        const displayLang = 'th';
        
        const handleClaim = async () => {
          if (isClaimed || isClaiming) {
            return;
          }
          
          setClaiming(prev => ({ ...prev, [message.id ?? '']: true }));
          
          try {
            const response = await fetch((evoucherInfo as any).claimUrl, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messageId: message.id,
                evoucherId: (evoucherInfo as any).evoucherId || null,
                timestamp: new Date().toISOString()
              })
            });
            
            if (response.ok) {
              setClaimed(prev => ({ ...prev, [message.id ?? '']: true }));
              showDialog('🎉 คุณได้รับ E-Voucher แล้ว!', 'success');
            } else {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage = errorData.message || 'ไม่สามารถรับ E-Voucher ได้';
              showDialog(`${errorMessage}`, 'error');
            }
          } catch (error) {
            console.error('Error claiming E-Voucher:', error);
            showDialog('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
          } finally {
            setClaiming(prev => ({ ...prev, [message.id ?? '']: false }));
          }
        };
        
                return (
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl border-2 border-amber-300/50 shadow-lg w-full max-w-sm sm:max-w-md">
            <div className="p-5">
              {/* Sponsor Image - Similar to Expo */}
              {(evoucherInfo as any).sponsorImage && (
                <div className="mb-4 flex justify-center">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md">
                    <img
                      src={(evoucherInfo as any).sponsorImage.startsWith('http') 
                        ? (evoucherInfo as any).sponsorImage 
                        : `${IMAGE_BASE_URL}/uploads/${(evoucherInfo as any).sponsorImage}`
                      }
                      alt="Sponsor"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Header - Similar to Expo */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-xl text-amber-800 dark:text-amber-200 leading-tight break-words mb-1">
                  {(evoucherInfo as any).message?.[displayLang] || 'E-Voucher'}
                </h3>
              </div>

              {/* E-Voucher Details */}
              <div className="mb-4 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">E-Voucher Code</span>
                                     <div 
                     className="text-xs text-amber-600 dark:text-amber-400 font-mono tracking-wider cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-800/30 px-2 py-1 rounded transition-all duration-300"
                   >
                     {showMysteryValues ? (
                       <span className="animate-pulse">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                     ) : (
                       <span className="animate-pulse tracking-tight whitespace-nowrap">❓❓❓</span>
                     )}
                   </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Valid Until</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Value</span>
                                     <div 
                     className="text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-800/30 px-2 py-1 rounded transition-all duration-300"
                   >
                     {showMysteryValues ? (
                       <span className="animate-pulse">฿{Math.floor(Math.random() * 500) + 50}</span>
                     ) : (
                       <span className="animate-pulse tracking-tight whitespace-nowrap">❓❓❓</span>
                     )}
                   </div>
                </div>
              </div>
              
              {/* Action Button - Similar to Expo */}
              {!isClaimed && (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming || !(evoucherInfo as any).claimUrl}
                  className={`w-full py-2.5 rounded-lg font-bold transition-all duration-300 ${
                    isClaiming
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-amber-400 text-amber-900 hover:bg-amber-500 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isClaiming ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Claiming...</span>
                    </div>
                  ) : (
                    <span className="text-sm">Claim</span>
                  )}
                </button>
              )}
              
              {/* Success Message - Similar to Expo */}
              {isClaimed && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <p className="text-green-600 dark:text-green-400 font-bold text-base">
                    คุณได้รับ E-Voucher แล้ว!
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }
    }
        
    
    // Sticker message: always show sticker image
    if (message.type === 'sticker' || message.stickerId) {
      return (
        <button 
          className="bg-transparent p-0 border-0 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 animate-fadein"
          onClick={() => handleOpenImagePreview(stickerImageUrl)} 
          onContextMenu={handleUnsend}
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
            onContextMenu={handleUnsend}
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
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200" onContextMenu={handleUnsend}>
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
      <div className={`${getMessageTextStyle()} whitespace-pre-wrap leading-relaxed max-w-full`} style={{ wordBreak: 'keep-all' }}>
        {message.text && typeof message.text === 'string' 
          ? renderWithMentions(message.text, currentUsername) 
          : null
        }
      </div>
    );
  }, [message, claimed, claiming, handleOpenImagePreview, handleUnsend, stickerImageUrl, getMessageTextStyle, renderWithMentions, currentUsername, stickers, getStickerImageUrl, showDialog]);

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
    return `${String(user.name.first || '')} ${String(user.name.last || '')}`.trim();
  }, []);

  const renderReplyPreview = useCallback(() => {
    if (!enrichedReplyTo) return null;
    
    const isReplyingToSelf = String(enrichedReplyTo.user?._id) === String(message.user?._id);
    
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
                ) : enrichedReplyTo.type === 'evoucher' ? (
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 ${
                      isMyMessage ? 'text-amber-400' : 'text-amber-500'
                    }`}>
                      🎁
                    </span>
                    <span className="text-sm truncate">
                      E-Voucher
                    </span>
                  </div>
                ) : enrichedReplyTo.type === 'sticker' || enrichedReplyTo.stickerId ? (
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 ${
                      isMyMessage ? 'text-purple-400' : 'text-purple-500'
                    }`}>
                      😀
                    </span>
                    <span className="text-sm truncate">
                      Sticker
                    </span>
                  </div>
                ) : (
                  <span className="text-sm line-clamp-2">
                    {typeof enrichedReplyTo.text === 'string' 
                      ? (renderWithMentions(enrichedReplyTo.text, currentUsername, true) || 'Empty message')
                      : 'Empty message'
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [enrichedReplyTo, isMyMessage, message.user, getDisplayName, currentUsername, renderWithMentions]);

  // Handle join/leave/restriction messages as special bubbles - centered but with proper bubble structure
  if (message.type === 'join' || message.type === 'leave' || message.type === 'restriction') {
    return (
      <div className="w-full flex justify-center mb-3" data-message-id={message.id}>
        <div className="flex flex-col items-center">
          {renderContent()}
          {/* Date/time under bubble */}
          <span className="text-xs font-medium text-gray-500 mt-2">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full flex flex-col ${isMyMessage ? 'items-end ml-12' : 'items-start mr-12'} mb-2 relative group`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-message-id={message.id}
    >
      {/* Reply Preview - Show above the message bubble */}
      {renderReplyPreview()}
      
      <div className={`flex items-end ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isMyMessage && (
          <Avatar
            name={getDisplayName(message.user || { name: { first: '', last: '' } })}
            size={36}
          />
        )}
        <div className={`flex flex-col max-w-[80%] ${isMyMessage ? 'items-end' : 'items-start'} relative`}>
          {/* Username */}
          {!isMyMessage && (
            <span className="text-xs font-semibold text-gray-800 mb-1 ml-1">{message.user?.username}</span>
          )}
          
          {/* Unsend Button - Show on hover for my messages */}
          {isMyMessage && showUnsendButton && (
            <div className="absolute top-1 -left-8 z-10 flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-gray-200/50 dark:border-gray-600/50 transition-all duration-300 animate-in slide-in-from-left-1">
              <button
                onClick={handleUnsend}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-1 transition-all duration-200 group/unsend"
                title="Unsend message"
              >
                <svg className="w-3.5 h-3.5 group-hover/unsend:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Sticker rendering (outside bubble) */}
          {((message.type === 'sticker' || message.stickerId) && stickerImageUrl) ? (
            <button 
              className="bg-transparent p-0 border-0 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 animate-fadein"
              onClick={() => handleOpenImagePreview(stickerImageUrl)} 
              onContextMenu={handleUnsend}
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
              style={{ wordBreak: 'keep-all' }}
            >
              {/* Render message content */}
              {renderContent()}
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

      {/* Claim Dialog */}
      {showClaimDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className={`max-w-sm w-full mx-4 p-6 rounded-2xl shadow-2xl transform transition-all duration-300 ${
            claimDialogType === 'success' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' 
              : claimDialogType === 'error'
              ? 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200'
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200'
          }`}>
            <div className="text-center">
              <div className={`text-4xl mb-4 ${
                claimDialogType === 'success' ? 'animate-bounce' : ''
              }`}>
                {claimDialogType === 'success' ? '🎉' : claimDialogType === 'error' ? '❌' : 'ℹ️'}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                claimDialogType === 'success' ? 'text-green-800' 
                : claimDialogType === 'error' ? 'text-red-800' 
                : 'text-blue-800'
              }`}>
                {claimDialogType === 'success' ? 'สำเร็จ!' 
                 : claimDialogType === 'error' ? 'เกิดข้อผิดพลาด' 
                 : 'แจ้งเตือน'}
              </h3>
              <p className={`text-sm leading-relaxed ${
                claimDialogType === 'success' ? 'text-green-700' 
                : claimDialogType === 'error' ? 'text-red-700' 
                : 'text-blue-700'
              }`}>
                {claimDialogMessage}
              </p>
              <button
                onClick={() => setShowClaimDialog(false)}
                className={`mt-4 px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                  claimDialogType === 'success'
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                    : claimDialogType === 'error'
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MessageBubble;