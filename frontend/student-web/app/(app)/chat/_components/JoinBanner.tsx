import React from 'react';

interface JoinBannerProps {
  onJoin: () => void;
  joining: boolean;
  roomCapacity: number;
  connectedCount: number;
}

const JoinBanner = ({ onJoin, joining, roomCapacity, connectedCount }: JoinBannerProps) => (
  <div className="backdrop-blur-md bg-black/70 p-6 flex flex-col items-center border-b border-gray-800 rounded-b-xl">
    <span className="text-white mb-2 text-base text-center">คุณยังไม่ได้เป็นสมาชิกห้องนี้ เข้าร่วมเพื่อเริ่มแชท</span>
    <span className="text-gray-400 mb-4 text-sm">{connectedCount}/{roomCapacity} คนเข้าร่วม</span>
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full min-w-[150px] flex items-center justify-center transition-colors duration-150 disabled:opacity-60"
      onClick={onJoin}
      disabled={joining}
      type="button"
    >
      {joining ? <span className="animate-spin mr-2">🔄</span> : null}
      {joining ? 'กำลังเข้าร่วม...' : 'เข้าร่วมห้องแชท'}
    </button>
  </div>
);

export default JoinBanner; 