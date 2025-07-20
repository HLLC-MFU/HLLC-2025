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
    // Find the target message element by data-message-id
    const targetElement = document.querySelector(`[data-message-id="${replyToId}"]`);
    if (targetElement) {
      // Scroll to the target message
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  // Show skeleton loading only when loading, not when empty
  if (loading) {
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

  // Show empty state when no messages and not loading
  if (allMessages.length === 0) {
    return (
      <div
        ref={flatListRef as React.RefObject<HTMLDivElement> as any}
        className="flex flex-col items-center justify-center pb-24 pt-4 overflow-y-auto h-full min-h-[60vh] scrollbar-none bg-transparent"
        onScroll={onScroll}
        style={{ minHeight: 200 }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Be the first to start the conversation!</p>
        </div>
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
        {/* Remove special handling for join/leave - let MessageBubble handle them */}
        {false ? (
          <SystemMessage text={''} timestamp={''} />
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
                  stickers={stickers}
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