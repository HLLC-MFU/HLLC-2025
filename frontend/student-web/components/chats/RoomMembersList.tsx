import React, { useEffect } from 'react';
import { RoomMember } from '@/types/chat';
import { useChatRoom } from '@/hooks/chats/useChatRoom';
import Avatar from './Avatar';

interface RoomMembersListProps {
  roomId: string;
  onMemberPress?: (member: RoomMember) => void;
}

const RoomMembersList = ({ roomId, onMemberPress }: RoomMembersListProps) => {
  const { loadMembers, loadMoreMembers, members, total, loading, hasMore } = useChatRoom();

  useEffect(() => {
    loadMembers(1, false);
  }, [roomId]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMoreMembers();
    }
  };

  const handleRefresh = () => {
    loadMembers(1, false);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <span className="text-lg font-semibold text-gray-900">Members ({total})</span>
        <button className="ml-4 text-blue-500 underline text-sm" onClick={handleRefresh} disabled={loading}>
          Refresh
        </button>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 400 }}>
        {members.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">No members found</div>
        )}
        {members.map((item) => (
          <div
            key={item.user_id}
            className="flex flex-row items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            onClick={() => onMemberPress?.(item)}
          >
            <Avatar size={40} name={`${item.user.name.first} ${item.user.name.last}`} />
            <div className="ml-3 flex-1">
              <div className="text-base font-medium text-gray-900">
                {item.user.name.first && item.user.name.last
                  ? `${item.user.name.first} ${item.user.name.last}`
                  : item.user.username || 'Unknown User'}
              </div>
              {item.user.username && (
                <div className="text-sm text-gray-500">@{item.user.username}</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-row items-center justify-center py-4 text-blue-500">Loading more members...</div>
        )}
        {!loading && hasMore && (
          <div className="flex flex-row items-center justify-center py-4">
            <button className="text-blue-500 underline" onClick={handleLoadMore}>Load More</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomMembersList; 