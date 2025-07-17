import React from 'react';

interface ChatHeaderProps {
  language: string;
  roomsCount: number;
  joinedRoomsCount: number;
}

export default function ChatHeader({
  language,
  roomsCount,
  joinedRoomsCount,
}: ChatHeaderProps) {
  return (
    <div className="pt-4 pb-4 px-0 w-full">
      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <div className="flex flex-row justify-between items-center mb-5 px-5">
          <div>
            <span className="text-sm text-white/80 font-medium drop-shadow">{language === 'th' ? 'สวัสดี!' : 'Welcome!'}</span>
            <div className="text-2xl font-bold text-white drop-shadow-lg mt-1">{language === 'th' ? 'ชุมชนของเรา' : 'Our Community'}</div>
          </div>
        </div>
        <div className="flex flex-row justify-around items-center bg-white/40 backdrop-blur-lg backdrop-saturate-150 ring-1 ring-white/40 border border-white/30 shadow-2xl rounded-2xl px-8 py-6 w-full transition-all">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center mb-2 shadow-lg">
              <span role="img" aria-label="users" className="text-2xl">👥</span>
            </div>
            <span className="text-2xl font-bold text-white drop-shadow-lg">{roomsCount}</span>
            <span className="text-sm text-white/80 font-medium drop-shadow">{language === 'th' ? 'ห้อง' : 'Rooms'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center mb-2 shadow-lg">
              <span role="img" aria-label="messages" className="text-2xl">💬</span>
            </div>
            <span className="text-2xl font-bold text-white drop-shadow-lg">{joinedRoomsCount}</span>
            <span className="text-sm text-white/80 font-medium drop-shadow">{language === 'th' ? 'เข้าร่วม' : 'Joined'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

