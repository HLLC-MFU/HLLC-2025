import React, { useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { useProfile } from '@/hooks/useProfile';

interface ChatInputProps {
  messageText: string;
  handleTextInput: (text: string) => void;
  handleSendMessage: () => void;
  isMember: boolean;
  isConnected: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  setShowStickerPicker: (show: boolean) => void;
  showStickerPicker: boolean;
  replyTo?: Message;
  setReplyTo?: (msg?: Message) => void;
  canSendImage?: boolean;
  // Add mention suggestion props
  mentionSuggestions?: any[];
  isMentioning?: boolean;
  handleMentionSelect?: (user: any) => void;
  // Add room prop for status and type validation
  room?: any;
  user?: any;
}

const ChatInput = ({
  messageText,
  handleTextInput,
  handleSendMessage,
  isMember,
  isConnected,
  inputRef,
  setShowStickerPicker,
  showStickerPicker,
  replyTo,
  setReplyTo,
  mentionSuggestions = [],
  isMentioning = false,
  handleMentionSelect,
  room,
}: ChatInputProps) => {
  const { user } = useProfile();
  const [isFocused, setIsFocused] = useState(false);
  const hasText = messageText.trim().length > 0;
  
  // Check if user has Administrator role
  const isAdministrator = user?.role?.name === 'Administrator';
  // MC Room logic
  const isMCRoom = room?.type === 'mc';
  const isFresher = user?.role?.name === 'Fresher';
  // Disable all but plain text for Fresher in MC room
  const isFresherInMCRoom = false; // Allow Fresher to send text in MC room
  // Check if room is read-only
  const isReadOnlyRoom = room?.type === 'readonly';
  // Check if room is inactive
  const isInactiveRoom = room?.status === 'inactive';
  // Determine if input should be disabled
  const isDisabled = !isMember || !isConnected || isInactiveRoom || (isReadOnlyRoom && !isAdministrator);
  // Determine if user can send messages
  const canSend = hasText && !isDisabled;

  // Debug log for mention suggestion
  

  const handleFocus = () => {
    setIsFocused(true);
    setShowStickerPicker(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSend = () => {
    if (canSend) {
      handleSendMessage();
    }
  };

  // Get placeholder text based on room status and user role
  const getPlaceholderText = () => {
    if (isInactiveRoom) {
      return 'This room is inactive';
    }
    if (isReadOnlyRoom && !isAdministrator) {
      return 'This room is read-only';
    }
    if (!isMember) {
      return 'Join the room to send messages';
    }
    if (!isConnected) {
      return 'Connecting...';
    }
    return 'Type a message...';
  };

  // const handleKeyPress = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter' && !e.shiftKey) {
  //     e.preventDefault();
  //     handleSend();
  //   }
  //   handleTyping();
  // };

  const getDisplayName = (user?: { name?: any; username?: string }) => {
    if (!user) return 'user';
    if (user.name) {
      if (typeof user.name === 'string') return user.name;
      if (user.name.first || user.name.last) {
        return `${String(user.name.first || '')} ${String(user.name.last || '')}`.trim();
      }
    }
    return String(user.username || 'user');
  };

  return (
    <div className="relative mb-6 mx-4">
      {/* MC Room Info Bar (styled like readonly) */}
      {isMCRoom && (
        <div className="mb-3 flex items-center gap-2 bg-blue-500/90 border border-blue-300/60 rounded-xl px-4 py-2 shadow text-white">
          <svg className="w-5 h-5 mr-2 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <div className="flex flex-col">
            <span className="font-bold text-sm">Master of Ceremonies Room</span>
            <span className="text-xs font-medium text-white/90">This is a room for submitting questions to MCs. You will only see your own messages.</span>
          </div>
        </div>
      )}
      {/* Readonly Room Info Bar (styled like MC) */}
      {isReadOnlyRoom && !isMCRoom && (
        <div className="mb-3 flex items-center gap-2 bg-blue-400/90 border border-blue-200/60 rounded-xl px-4 py-2 shadow text-white">
          <svg className="w-5 h-5 mr-2 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <div className="flex flex-col">
            <span className="font-bold text-sm">Read-only Room</span>
            <span className="text-xs font-medium text-white/90">This is a read-only room. Only administrators can send messages.</span>
          </div>
        </div>
      )}
      {/* Mention Suggestions Dropdown */}
      {isMentioning && mentionSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 bottom-16 z-50 bg-white/90 backdrop-blur-md rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
          {mentionSuggestions.map((item: any) => (
            <button
              key={item.user_id}
              className="flex items-center w-full px-4 py-2 hover:bg-blue-50 focus:bg-blue-100 text-left"
              onClick={() => handleMentionSelect && handleMentionSelect(item)}
              type="button"
            >
              <img
                src={String(item.user.profile_image_url || 'https://www.gravatar.com/avatar/?d=mp')}
                alt={String(item.user.username || 'avatar')}
                className="w-7 h-7 rounded-full mr-3 object-cover bg-gray-200"
              />
              <span className="text-base text-gray-800 font-medium">@{String(item.user.username || '')}</span>
              {item.user.name?.first && item.user.name?.last && (
                <span className="ml-2 text-gray-500 text-sm">
                  {String(item.user.name.first || '')} {String(item.user.name.last || '')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {replyTo && (
        <div className="flex items-center bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-t-2xl p-3 border-b border-blue-200/50 dark:border-blue-700/50 shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
              <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                Replying to {String(replyTo.user?._id) === String(user?._id) ? 'yourself' : getDisplayName(replyTo.user)}
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 truncate pl-6 font-medium">
              {typeof replyTo.text === 'string' && replyTo.text.trim() !== '' ? (
                replyTo.text
              ) : replyTo.type === 'evoucher' ? (
                <span className="flex items-center text-amber-600 dark:text-amber-400">
                  <span className="mr-1">🎁</span>
                  E-Voucher
                </span>
              ) : replyTo.type === 'sticker' ? (
                <span className="flex items-center text-purple-600 dark:text-purple-400">
                  <span className="mr-1">😀</span>
                  Sticker
                </span>
              ) : replyTo.type === 'file' ? (
                <span className="flex items-center text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Image or file
                </span>
              ) : (
                <span className="flex items-center text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Image or file
                </span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setReplyTo && setReplyTo(undefined);
            }}
            className="ml-3 p-1.5 rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/30 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110"
            type="button"
            aria-label="Cancel reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className={`relative flex items-center rounded-3xl p-1.5 min-h-[56px] border-2 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg hover:shadow-xl ${
        isFocused 
          ? 'border-blue-400 dark:border-blue-500 shadow-blue-500/20 bg-white/90 dark:bg-gray-800/90' 
          : 'border-gray-200/50 dark:border-gray-600/50'
      } ${replyTo ? 'rounded-tl-none rounded-tr-none' : ''} ${
        isDisabled ? 'opacity-60' : ''
      }`}>
        
        {!isConnected && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
          </div>
        )}

        <div className="flex items-center w-full px-1">

          <div className="flex-1 mx-2">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => handleTextInput(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={getPlaceholderText()}
              className={`w-full bg-transparent text-gray-900 dark:text-gray-100 text-[15px] py-2.5 min-h-[40px] outline-none font-medium placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed ${
                isDisabled ? 'cursor-not-allowed' : ''
              }`}
              style={{
                wordBreak: 'keep-all',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              disabled={isDisabled}
              maxLength={1000}
            />
            
            {messageText.length > 800 && (
              <div className={`absolute bottom-0 right-16 text-xs font-medium ${
                messageText.length > 950 ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {messageText.length}/1000
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                showStickerPicker 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 scale-110' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:scale-110'
              } ${(isDisabled || isFresherInMCRoom) ? 'opacity-50 cursor-not-allowed' : 'shadow-sm hover:shadow-md'}`}
              onClick={() => !isFresherInMCRoom && setShowStickerPicker(!showStickerPicker)}
              disabled={isDisabled || isFresherInMCRoom}
              type="button"
            >
              <span className="text-lg transition-transform duration-200">
                {showStickerPicker ? '\ud83d\ude0a' : '\ud83d\ude0a'}
              </span>
            </button>

            <button
              className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                canSend 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl shadow-blue-500/25 hover:scale-110 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleSend}
              disabled={!canSend}
              type="submit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      <div className="absolute -bottom-6 left-0 right-0 flex justify-between items-center px-4">

        {isDisabled && (
          <div className="text-xs text-red-500 dark:text-red-400 font-medium bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-full shadow-sm">
            {!isConnected ? 'Connection problem' : 
             !isMember ? 'Please join the group first' : 
             isInactiveRoom ? 'Room is inactive' : 
             isReadOnlyRoom && !isAdministrator ? 'Read only' : 
             'Cannot send message'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;