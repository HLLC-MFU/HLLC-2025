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
  const isRoomFull = roomCapacity > 0 && connectedCount >= roomCapacity;
  
  return (
  <div className="backdrop-blur-md bg-black/70 p-6 flex flex-col items-center border-b border-gray-800 rounded-b-xl">
      {/* Status Badge */}
      <div className="mb-4 flex items-center gap-2">
        {isInactive ? (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-300 text-sm font-medium">Room is inactive</span>
          </div>
        ) : isRoomFull ? (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-300 text-sm font-medium">Room is full</span>
          </div>
        ) : isReadOnly ? (
          <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-300 text-sm font-medium">Room is readonly</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">Room is active</span>
          </div>
        )}
      </div>

      <span className="text-white mb-2 text-base text-center">
        {isInactive 
          ? 'Room is inactive, you cannot join' 
          : isRoomFull
          ? 'Room is full, you cannot join'
          : 'You are not a member of this room, join to start chat'
        }
      </span>
      
    <span className="text-gray-400 mb-4 text-sm">{connectedCount}/{roomCapacity} members</span>
      
      {!isInactive && !isRoomFull && (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full min-w-[150px] flex items-center justify-center transition-colors duration-150 disabled:opacity-60"
      onClick={onJoin}
      disabled={joining}
      type="button"
    >
      {joining ? <span className="animate-spin mr-2">🔄</span> : null}
      {joining ? 'Joining...' : 'Join room'}
    </button>
      )}
      
      {(isInactive || isRoomFull) && (
        <div className="bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-lg">
          <span className="text-red-300 text-sm">
            {isInactive ? 'You cannot join inactive room' : 'You cannot join full room'}
          </span>
        </div>
      )}
  </div>
);
};

export default JoinBanner; 