import React, { useState } from 'react';
import { ChatRoom } from '@/types/chat';
import { useChatRoom } from '@/hooks/chats/useChatRoom';
import RoomMembersList from './RoomMembersList';
import Avatar from './Avatar';

interface RoomInfoProps {
  room: ChatRoom;
  onClose: () => void;
}

const RoomInfo = ({ room, onClose }: RoomInfoProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const { handleJoin, joining, isMember, members, loadMembers, loadMoreMembers, loading } = useChatRoom({});

  const handleJoinPress = () => {
    if (!isMember) {
      if (window.confirm(`Are you sure you want to join "${room.name.th}"?`)) {
        handleJoin();
      }
    }
  };

  const handleMemberPress = (member: any) => {
    // Handle member press - could show profile or start DM
    console.log('Member pressed:', member);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <span className="text-lg font-semibold text-gray-900">Room Information</span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
          aria-label="Close"
        >
          <span className="text-lg text-gray-600">✕</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-row border-b border-gray-200">
        <button
          className={`flex-1 py-3 text-center ${activeTab === 'info' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button
          className={`flex-1 py-3 text-center ${activeTab === 'members' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({room.members_count})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' ? (
          <div className="flex flex-col p-6 space-y-6">
            {/* Room Avatar */}
            <div className="flex justify-center mb-6">
              <Avatar size={64} name={room.name.th?.[0] || 'R'} />
            </div>

            {/* Room Name */}
            <div className="mb-6">
              <div className="text-base font-semibold text-gray-900 mb-1">Room Name</div>
              <div className="text-xl font-bold text-gray-900 mb-1">{room.name.th}</div>
              {room.name.en && room.name.en !== room.name.th && (
                <div className="text-base text-gray-500 italic">{room.name.en}</div>
              )}
            </div>

            {/* Room Details */}
            <div className="mb-6">
              <div className="text-base font-semibold text-gray-900 mb-2">Details</div>
              <div className="flex flex-row justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Type:</span>
                <span className="text-sm text-gray-900">{room.category}</span>
              </div>
              <div className="flex flex-row justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Capacity:</span>
                <span className="text-sm text-gray-900">{room.members_count}/{room.capacity}</span>
              </div>
              <div className="flex flex-row justify-between items-center py-2">
                <span className="text-sm text-gray-500 font-medium">Created:</span>
                <span className="text-sm text-gray-900">{formatDate(room.created_at)}</span>
              </div>
            </div>

            {/* Join Button */}
            {!isMember && (
              <button
                className={`w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors ${joining ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={handleJoinPress}
                disabled={joining}
              >
                {joining ? 'Joining...' : 'Join Room'}
              </button>
            )}

            {/* Member Status */}
            {isMember && (
              <div className="w-full bg-green-50 text-green-700 py-3 rounded-lg text-center font-medium mt-2">
                ✓ You are a member
              </div>
            )}
          </div>
        ) : (
          <RoomMembersList
            roomId={room.id}
            onMemberPress={handleMemberPress}
            members={members}
            loadMembers={loadMembers}
            loadMoreMembers={loadMoreMembers}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default RoomInfo; 