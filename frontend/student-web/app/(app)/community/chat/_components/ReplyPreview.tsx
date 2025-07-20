import React from 'react';
import { Message } from '@/types/chat';

interface ReplyPreviewProps {
  replyTo: Message & { notFound?: boolean };
  isMyMessage: boolean;
  currentUsername: string;
  currentUserId: string;
  onReplyPreviewClick: (replyToId: string) => void;
  getDisplayName: (user?: any) => string;
  renderWithMentions: (text: string, currentUsername: string) => React.ReactNode | null;
}

const ReplyPreview = ({ 
  replyTo, 
  isMyMessage, 
  currentUsername, 
  currentUserId,
  onReplyPreviewClick, 
  getDisplayName,
  renderWithMentions 
}: ReplyPreviewProps) => {
  // Safety check to ensure replyTo is valid
  if (!replyTo || typeof replyTo !== 'object') {
    return null;
  }
  
  const isReplyingToSelf = String(replyTo.user?._id) === String(currentUserId);

  return (
    <div 
      className={`w-full flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1.5`}
      onClick={(e) => {
        e.stopPropagation();
        if (replyTo.id && onReplyPreviewClick) {
          onReplyPreviewClick(replyTo.id);
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
              ? `Replying to ${isReplyingToSelf ? 'yourself' : getDisplayName(replyTo.user) || 'user'}`
              : `${getDisplayName(replyTo.user) || 'Someone'} replied to ${isReplyingToSelf ? 'themselves' : getDisplayName(replyTo.user) || 'you'}`}
          </span>
        </div>
        <div className={`text-sm truncate pl-4 border-l-2 ${
          isMyMessage 
            ? 'border-blue-200 dark:border-blue-800 text-gray-700 dark:text-gray-200' 
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          {replyTo?.notFound ? (
            <span className="text-gray-400 dark:text-gray-500 italic text-xs">[Message not found]</span>
          ) : (
            <div className="space-y-1.5">
              {replyTo.type === 'file' && replyTo.fileType?.startsWith('image/') ? (
                <div className="flex items-center">
                  <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 ${
                    isMyMessage ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-sm truncate">
                    {replyTo.fileName || 'Image'}
                  </span>
                </div>
              ) : replyTo.type === 'file' && !replyTo.fileType?.startsWith('image/') ? (
                <div className="flex items-center">
                  <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 ${
                    isMyMessage ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <span className="text-sm truncate">
                    {replyTo.fileName || 'File'}
                  </span>
                </div>
              ) : replyTo.type === 'evoucher' ? (
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
              ) : replyTo.type === 'sticker' || replyTo.stickerId ? (
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
                  {typeof replyTo.text === 'string' && replyTo.text.trim() !== ''
                    ? (renderWithMentions(replyTo.text, currentUsername) || 'Empty message')
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
};

export default ReplyPreview; 