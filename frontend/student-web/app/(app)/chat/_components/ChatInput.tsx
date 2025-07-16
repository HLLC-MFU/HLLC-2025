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
        <div className="flex items-center bg-white/20 backdrop-blur rounded-xl p-2 mb-1 mx-0.5">
          <span className="text-gray-400 mr-1.5">↩</span>
          <span className="text-gray-900 opacity-80 flex-1 truncate">
            {replyTo.text}
          </span>
          <button
            onClick={() => setReplyTo && setReplyTo(undefined)}
            className="text-gray-400 text-base ml-2"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
      <div className={`flex items-end rounded-3xl p-2 min-h-14 border-2 transition-all duration-300 bg-white/30 backdrop-blur shadow-lg ${isFocused ? 'border-blue-400' : 'border-white/30'}`}>
        {/* Image/plus button */}
        {canSendImage && (
          <button
            className={`m-1 w-11 h-11 rounded-full flex items-center justify-center transition-opacity bg-white/20 hover:bg-blue-100/40 ${isDisabled ? 'opacity-50' : ''}`}
            onClick={handleImageUpload}
            disabled={isDisabled}
            type="button"
          >
            <span className="text-blue-500 text-xl">+</span>
          </button>
        )}
        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={messageText}
          onChange={(e) => handleTextInput(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={isDisabled ? 'กำลังเชื่อมต่อ...' : 'พิมพ์ข้อความ...'}
          className={`flex-1 bg-transparent text-gray-900 text-base px-2 py-3 min-h-11 outline-none font-medium placeholder-gray-400 ${isDisabled ? 'opacity-50' : ''}`}
          disabled={isDisabled}
          maxLength={1000}
        />
        {/* Send button */}
        {hasText && (
          <button
            className={`m-1 w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:scale-105 transition-transform ${!canSend ? 'opacity-50' : ''}`}
            onClick={handleSend}
            disabled={!canSend}
            type="button"
          >
            <span className="text-white text-lg">→</span>
          </button>
        )}
        {/* Emoji/sticker button */}
        <button
          className={`m-1 w-11 h-11 rounded-full flex items-center justify-center transition-all ${showStickerPicker ? 'bg-yellow-400/20' : 'hover:bg-white/20'} ${isDisabled ? 'opacity-50' : ''}`}
          onClick={() => setShowStickerPicker(!showStickerPicker)}
          disabled={isDisabled}
          type="button"
        >
          <span className={`text-lg ${showStickerPicker ? 'text-yellow-500' : 'text-gray-700'}`}>😊</span>
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