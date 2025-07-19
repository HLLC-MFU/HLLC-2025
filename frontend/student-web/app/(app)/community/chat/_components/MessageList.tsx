import React, { useMemo, useEffect } from 'react';
import SwipeableMessageBubble from './SwipeableMessageBubble';
import SystemMessage from './SystemMessage';
import MessageSkeleton from './MessageSkeleton';
import { Message } from '@/types/chat';
import { useProfile } from '@/hooks/useProfile';

interface MessageListProps {
  messages: Message[][];
  userId: string;
  currentUsername: string;
  flatListRef: React.RefObject<HTMLDivElement | null>;
  onReply: (message: Message) => void;
  onRetry?: (message: Message) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollEventThrottle?: number;
  onUnsend?: (message: Message) => void;
  stickers: any[];
  loading?: boolean;
}

const MessageList = ({
  messages,
  userId,
  currentUsername,
  flatListRef,
  onReply,
  onScroll,
  onUnsend,
  stickers,
  loading = false,
}: MessageListProps) => {
  // flatten all messages for replyTo enrichment (sort from oldest to newest)
  const allMessages = useMemo(() => {
    const flattened = messages.flat();
    const uniqueMessages = new Map(); // Use a Map to deduplicate messages by ID
    flattened
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(msg => {
        if (msg?.id) {
          uniqueMessages.set(msg.id, msg);
        }
      });
    return Array.from(uniqueMessages.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  // DEBUG  ไว้ log messages ค่อยลบตอนจะ Pull request
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[MessageList] messages to render:', allMessages);
    }
  }, [allMessages]);

  const handleReplyPreviewClick = (replyToId: string) => {
    const flat = allMessages;
    const index = flat.findIndex(m => m.id === replyToId);
    if (index !== -1 && flatListRef.current) {
      let groupIdx = 0;
      let msgIdx = 0;
      let count = 0;
      for (let i = 0; i < messages.length; i++) {
        for (let j = 0; j < messages[i].length; j++) {
          if (messages[i][j].id === replyToId) {
            groupIdx = i;
            msgIdx = j;
            break;
          }
          count++;
        }
      }
      flatListRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Show skeleton loading if loading or no messages
  if (loading || allMessages.length === 0) {
    return (
      <div
        ref={flatListRef as React.RefObject<HTMLDivElement> as any}
        className="flex flex-col gap-2 pb-24 pt-4 overflow-y-auto h-full min-h-[60vh] scrollbar-none bg-transparent"
        onScroll={onScroll}
        style={{ minHeight: 200 }}
      >
        <MessageSkeleton count={5} isMyMessage={false} />
        <MessageSkeleton count={3} isMyMessage={true} />
        <MessageSkeleton count={4} isMyMessage={false} />
      </div>
    );
  }

  return (
    <div
    ref={flatListRef as React.RefObject<HTMLDivElement> as any}
    className="flex flex-col gap-2 pb-24 pt-4 overflow-y-auto h-full min-h-[60vh] scrollbar-none bg-transparent"
    onScroll={onScroll}
    style={{ minHeight: 200 }}
  >
    {messages.map((group, groupIdx) => (
      <div key={groupIdx} className="mb-4">
        {group.length === 1 && (group[0].type === 'join' || group[0].type === 'leave') ? (
          <SystemMessage text={group[0].text || ''} timestamp={group[0].timestamp || ''} />
        ) : (
          <div className="mb-2">
            {group.map((message, index) => {
              if (!message || !message.id || !message.type || !message.timestamp) {
                return (
                  <div key={`invalid-${index}`} className="p-2 bg-red-100 rounded mb-2">
                    <span className="text-red-700 text-sm">Invalid message format</span>
                  </div>
                );
              }
              const isMyMessage = message.user?._id === userId;
              const isLastInGroup = index === group.length - 1;
              const isFirstInGroup = index === 0;
              return (
                <SwipeableMessageBubble
                  key={message.id || `msg-${index}`}
                  message={message}
                  isMyMessage={isMyMessage}
                  isRead={message.isRead}
                  showAvatar={!isMyMessage && isLastInGroup}
                  isLastInGroup={isLastInGroup}
                  isFirstInGroup={isFirstInGroup}
                  onReply={onReply}
                  allMessages={allMessages}
                  onReplyPreviewClick={handleReplyPreviewClick}
                  currentUsername={currentUsername}
                  onUnsend={onUnsend}
                />
              );
            })}
          </div>
        )}
      </div>
    ))}
  </div>  
  );
};

export default MessageList; 