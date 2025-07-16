import React, { useState, useRef } from 'react';

interface ChatInputProps {
  messageText: string;
  handleTextInput: (text: string) => void;
  handleSendMessage: () => void;
  handleImageUpload: () => void;
  handleTyping: () => void;
  isMember: boolean;
  isConnected: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setShowStickerPicker: (show: boolean) => void;
  showStickerPicker: boolean;
  replyTo?: any;
  setReplyTo?: (msg?: any) => void;
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

  const handleSend = () => {
    if (canSend) {
      handleSendMessage();
    }
  };

  return (
    <div className="relative mb-5 mx-2">
      {replyTo && (
        <div className="flex flex-row items-center bg-white/10 rounded-lg p-2 mb-1">
          <span className="mr-2">↩️</span>
          <span className="text-white/80 flex-1 truncate">{replyTo.text}</span>
          <button onClick={() => setReplyTo && setReplyTo(undefined)} className="ml-2 text-gray-400 text-lg">✕</button>
        </div>
      )}
      <div className={`flex flex-row items-end rounded-full p-2 min-h-[56px] border-2 ${isFocused ? 'border-blue-400 shadow-lg' : 'border-white/20'} bg-white/5 transition-all duration-200`}>
        {canSendImage && (
          <button
            className={`mx-1 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 ${isDisabled ? 'opacity-50' : ''}`}
            onClick={handleImageUpload}
            disabled={isDisabled}
            type="button"
          >
            <span role="img" aria-label="plus">➕</span>
          </button>
        )}
        <input
          ref={inputRef as any}
          className={`flex-1 bg-transparent text-white text-base outline-none px-2 py-2 ${isDisabled ? 'opacity-50' : ''}`}
          value={messageText}
          onChange={e => handleTextInput(e.target.value)}
          placeholder={isDisabled ? 'Connecting...' : 'Type a message'}
          disabled={isDisabled}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
        />
        {hasText && (
          <button
            className={`mx-1 w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 ${!canSend ? 'opacity-50' : ''}`}
            onClick={handleSend}
            disabled={!canSend}
            type="button"
          >
            <span role="img" aria-label="send">📤</span>
          </button>
        )}
        <button
          className={`mx-1 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 ${showStickerPicker ? 'bg-yellow-200/20' : ''} ${isDisabled ? 'opacity-50' : ''}`}
          onClick={() => setShowStickerPicker(!showStickerPicker)}
          disabled={isDisabled}
          type="button"
        >
          <span role="img" aria-label="smile">😊</span>
        </button>
      </div>
      {!isConnected && (
        <div className="absolute top-0 right-2">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400 border-2 border-white"></span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;