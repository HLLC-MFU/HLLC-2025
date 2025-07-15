import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import React, { useEffect, useState } from 'react';

interface Sticker {
  id: string;
  name: {
    th: string;
    en: string;
  };
  image: string;
}

interface StickerPickerProps {
  onSelectSticker: (stickerId: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchStickers();
    // eslint-disable-next-line
  }, []);

  const fetchStickers = async () => {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/api/stickers`);
      if (!response.ok) {
        throw new Error('Failed to fetch stickers');
      }
      const data = await response.json();
      setStickers(data.data);
    } catch (err) {
      console.error('Error fetching stickers:', err);
      setError('Failed to load stickers');
    } finally {
      setLoading(false);
    }
  };

  const getStickerImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${CHAT_BASE_URL}/uploads/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-end justify-center z-50 bg-black/25">
        <div className="w-full max-w-lg bg-white rounded-t-2xl p-8 flex flex-col items-center">
          <div className="text-blue-500 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-end justify-center z-50 bg-black/25">
        <div className="w-full max-w-lg bg-white rounded-t-2xl p-8 flex flex-col items-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={fetchStickers}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50 bg-black/25">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-6 flex flex-col">
        <div className="flex flex-row justify-between items-center mb-4">
          <span className="text-lg font-bold">Stickers</span>
          <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-full text-blue-600 font-semibold">Close</button>
        </div>
        <div className="grid grid-cols-4 gap-4 pb-4">
          {stickers.map((item, index) => (
            <button
              key={item.id}
              className={`flex flex-col items-center p-2 rounded-xl border ${pressedIndex === index ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-transparent'}`}
              onClick={() => onSelectSticker(item.id)}
              onMouseDown={() => setPressedIndex(index)}
              onMouseUp={() => setPressedIndex(null)}
              onMouseLeave={() => setPressedIndex(null)}
              type="button"
            >
              <img
                src={getStickerImageUrl(item.image)}
                alt={item.name.th}
                className="w-14 h-14 rounded mb-1 bg-gray-200"
                style={{ objectFit: 'contain' }}
              />
              <span className="text-xs text-gray-700 truncate w-full text-center">{item.name.th}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
