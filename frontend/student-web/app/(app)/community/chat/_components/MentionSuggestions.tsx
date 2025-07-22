import React from 'react';
import { RoomMember } from '@/types/chat';

interface MentionSuggestionsProps {
  suggestions: RoomMember[];
  onSelect: (user: RoomMember) => void;
}

const MentionSuggestions = ({ suggestions, onSelect }: MentionSuggestionsProps) => {
  if (!suggestions.length) return null;
  return (
    <div className="absolute left-2 right-2 bottom-20 max-h-[150px] bg-zinc-800/90 rounded-lg border border-zinc-700 overflow-y-auto z-40">
      {suggestions.map((item) => (
        <button
          key={item.user_id}
          className="flex flex-row items-center w-full px-3 py-2 border-b border-zinc-700 hover:bg-zinc-700/60 focus:bg-zinc-700/80 last:border-b-0"
          onClick={() => onSelect(item)}
          type="button"
        >
          <img
            src={item.user.profile_image_url || 'https://www.gravatar.com/avatar/?d=mp'}
            alt={item.user.username || 'avatar'}
            className="w-7 h-7 rounded-full mr-3 object-cover bg-zinc-600"
          />
          <span className="text-white text-base">
            {item.user_id === 'all'
              ? 'แจ้งทุกคน'
              : item.user.name && item.user.name.first && item.user.name.last
                ? `${String(item.user.name.first || '')} ${String(item.user.name.last || '')}`.trim()
                : item.user.username || 'Unknown User'}
          </span>
        </button>
      ))}
    </div>
  );
};

export default MentionSuggestions; 