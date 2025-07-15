import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';

interface ChatInputProps {
  messageText: string;
  handleTextInput: (text: string) => void;
  handleSendMessage: () => void;
  handleImageUpload: () => void;
  handleTyping: () => void;
  isMember: boolean;
  isConnected: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  setShowStickerPicker: (show: boolean) => void;
  showStickerPicker: boolean;
  replyTo?: Message;
  setReplyTo?: (msg?: Message) => void;
  canSendImage?: boolean;
}

const ChatInput = ({
  messageText,
  handleTextInput,
  handleSendMessage,
  handleImageUpload,
  handleTyping,
  isMember,
  isConnected,
  inputRef,
  setShowStickerPicker,
  showStickerPicker,
  replyTo,
  setReplyTo,
  canSendImage = true,
}: ChatInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasText = messageText.trim().length > 0;
  const isDisabled = !isMember || !isConnected;
  const canSend = hasText && !isDisabled;

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative mb-5 mx-2.5">
      {replyTo && (
        <div className="flex items-center bg-white/10 rounded-xl p-2 mb-1 mx-0.5">
          <span className="text-gray-400 mr-1.5">↩</span>
          <span className="text-white opacity-70 flex-1 truncate">
            {replyTo.text}
          </span>
          <button
            onClick={() => setReplyTo && setReplyTo(undefined)}
            className="text-gray-400 text-base ml-2"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className={`flex items-end rounded-3xl p-1.5 min-h-14 border-2 transition-all duration-300 ${
        isFocused 
          ? 'border-blue-500 shadow-lg shadow-blue-500/30' 
          : 'border-white/20'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-white/5 rounded-3xl" />

        {canSendImage && (
          <button
            className={`m-1 w-11 h-11 rounded-full flex items-center justify-center transition-opacity ${
              isDisabled ? 'opacity-50' : 'hover:bg-white/20'
            }`}
            onClick={handleImageUpload}
            disabled={isDisabled}
          >
            <span className="text-white text-xl">+</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={messageText}
          onChange={(e) => handleTextInput(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={isDisabled ? 'กำลังเชื่อมต่อ...' : 'พิมพ์ข้อความ...'}
          className={`flex-1 bg-transparent text-white text-base px-1 py-3 min-h-11 outline-none ${
            isDisabled ? 'opacity-50' : ''
          }`}
          disabled={isDisabled}
          maxLength={1000}
        />

        {hasText && (
          <button
            className={`m-1 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              canSend 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-lg' 
                : 'bg-white/10 opacity-50'
            }`}
            onClick={handleSend}
            disabled={!canSend}
          >
            <span className="text-white text-lg">→</span>
          </button>
        )}

        <button
          className={`m-1 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            showStickerPicker 
              ? 'bg-yellow-500/20' 
              : isDisabled 
                ? 'opacity-50' 
                : 'hover:bg-white/20'
          }`}
          onClick={() => setShowStickerPicker(!showStickerPicker)}
          disabled={isDisabled}
        >
          <span className={`text-lg ${showStickerPicker ? 'text-yellow-400' : 'text-white/80'}`}>
            😊
          </span>
        </button>
      </div>

      {!isConnected && (
        <div className="absolute -top-1 right-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
        </div>
      )}
    </div>
  );
};

export default ChatInput; 