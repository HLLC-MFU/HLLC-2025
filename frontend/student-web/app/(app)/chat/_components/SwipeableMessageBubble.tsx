import React from 'react';
import MessageBubble from './MessageBubble';
import { Message } from '@/types/chat';
import { Reply } from 'lucide-react';

interface SwipeableMessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  isRead: boolean;
  showAvatar?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
  onReply: (message: Message) => void;
  allMessages?: Message[];
  onReplyPreviewClick?: (replyToId: string) => void;
  currentUsername: string;
  onUnsend?: (message: Message) => void;
}

const SwipeableMessageBubble: React.FC<SwipeableMessageBubbleProps> = ({
  message,
  isMyMessage,
  isRead,
  showAvatar = true,
  isLastInGroup = true,
  isFirstInGroup = true,
  onReply,
  allMessages = [],
  onReplyPreviewClick,
  currentUsername,
  onUnsend,
}) => {
  return (
    <div className="relative flex items-center group">
      <MessageBubble
        message={message}
        isMyMessage={isMyMessage}
        isRead={isRead}
        showAvatar={showAvatar}
        isLastInGroup={isLastInGroup}
        isFirstInGroup={isFirstInGroup}
        onReply={onReply}
        allMessages={allMessages}
        onReplyPreviewClick={onReplyPreviewClick}
        currentUsername={currentUsername}
        onUnsend={onUnsend}
      />
      <button
        className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 border border-gray-200 shadow"
        style={{ right: isMyMessage ? 'auto' : 0, left: isMyMessage ? 0 : 'auto' }}
        onClick={() => onReply(message)}
        title="Reply"
        type="button"
      >
        <Reply size={22} color="#0A84FF" />
      </button>
    </div>
  );
};

export default SwipeableMessageBubble; 