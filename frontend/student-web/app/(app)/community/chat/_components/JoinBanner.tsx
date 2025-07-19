import React from 'react';

interface JoinBannerProps {
  onJoin: () => void;
  joining: boolean;
  roomCapacity: number;
  connectedCount: number;
  roomStatus?: string;
  roomType?: string;
}

const JoinBanner = ({ onJoin, joining, roomCapacity, connectedCount, roomStatus, roomType }: JoinBannerProps) => {
  const isInactive = roomStatus === 'inactive';
  const isReadOnly = roomType === 'readonly';
  
  return (
  <div className="backdrop-blur-md bg-black/70 p-6 flex flex-col items-center border-b border-gray-800 rounded-b-xl">
      {/* Status Badge */}
      <div className="mb-4 flex items-center gap-2">
        {isInactive ? (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-300 text-sm font-medium">ห้องปิดใช้งาน</span>
          </div>
        ) : isReadOnly ? (
          <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-300 text-sm font-medium">ห้องอ่านอย่างเดียว</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">ห้องเปิดใช้งาน</span>
          </div>
        )}
      </div>

      <span className="text-white mb-2 text-base text-center">
        {isInactive 
          ? 'ห้องนี้ปิดใช้งานแล้ว ไม่สามารถเข้าร่วมได้' 
          : 'คุณยังไม่ได้เป็นสมาชิกห้องนี้ เข้าร่วมเพื่อเริ่มแชท'
        }
      </span>
      
    <span className="text-gray-400 mb-4 text-sm">{connectedCount}/{roomCapacity} คนเข้าร่วม</span>
      
      {!isInactive && (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full min-w-[150px] flex items-center justify-center transition-colors duration-150 disabled:opacity-60"
      onClick={onJoin}
      disabled={joining}
      type="button"
    >
      {joining ? <span className="animate-spin mr-2">🔄</span> : null}
      {joining ? 'กำลังเข้าร่วม...' : 'เข้าร่วมห้องแชท'}
    </button>
      )}
      
      {isInactive && (
        <div className="bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-lg">
          <span className="text-red-300 text-sm">ไม่สามารถเข้าร่วมห้องที่ปิดใช้งานได้</span>
        </div>
      )}
  </div>
);
};

export default JoinBanner; 