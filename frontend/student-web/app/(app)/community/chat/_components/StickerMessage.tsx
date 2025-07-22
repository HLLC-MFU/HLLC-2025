import React from 'react';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';

interface StickerMessageProps {
  message: any;
  stickers: any[];
  onImagePreview: (imageUrl: string) => void;
  onUnsend: () => void;
}

const StickerMessage = ({ message, stickers, onImagePreview, onUnsend }: StickerMessageProps) => {
  const getStickerImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return `${CHAT_BASE_URL}/uploads/${imagePath}`;
  };

  // Always resolve sticker image from message or stickers list
  const stickerImageUrl = (() => {
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
  })();

  return (
    <button 
      className="bg-transparent p-0 border-0 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 animate-fadein"
      onClick={() => onImagePreview(stickerImageUrl)} 
      onContextMenu={onUnsend}
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
};

export default StickerMessage; 