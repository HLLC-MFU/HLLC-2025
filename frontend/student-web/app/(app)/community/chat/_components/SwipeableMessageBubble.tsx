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
  stickers?: any[];
  room?: any;
  user?: any;
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
  stickers,
  room,
  user,
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
        stickers={stickers}
        room={room}
        user={user}
      />
      <button
        className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 border border-gray-200 shadow"
        style={{ right: isMyMessage ? 'auto' : 0, left: isMyMessage ? 0 : 'auto' }}
        onClick={() => {
          // Create a clean reply object with only necessary fields
          let replyId = message.id;
          
          // For evoucher messages, use message._id from payload if available
          if (message.type === 'evoucher' && message.payload?.evoucherInfo?.message?._id) {
            replyId = message.payload.evoucherInfo.message._id;
          }
          
          const cleanReplyMessage = {
            id: replyId,
            text: message.text,
            type: message.type,
            timestamp: message.timestamp,
            user: message.user,
            stickerId: message.stickerId,
            fileName: message.fileName,
            fileType: message.fileType,
            // For evoucher messages, don't include the complex evoucherInfo object
            // The reply preview will handle evoucher type rendering
          };
          onReply(cleanReplyMessage as Message);
        }}
        title="Reply"
        type="button"
      >
        <Reply size={22} color="#0A84FF" />
      </button>
    </div>
  );
};

export default SwipeableMessageBubble; 