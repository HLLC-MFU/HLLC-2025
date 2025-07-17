import React, { useMemo, useEffect } from 'react';
import SwipeableMessageBubble from './SwipeableMessageBubble';
import SystemMessage from './SystemMessage';
import TypingIndicator from './TypingIndicator';
import { Message } from '@/types/chat';
import { useProfile } from '@/hooks/useProfile';

interface MessageListProps {
  messages: Message[][];
  userId: string;
  typing: { id: string; name?: string }[];
  flatListRef: React.RefObject<HTMLDivElement | null>;
  onReply: (message: Message) => void;
  onRetry?: (message: Message) => void;
  scrollToBottom: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollEventThrottle?: number;
  onUnsend?: (message: Message) => void;
}

const MessageList = ({
  messages,
  userId,
  typing,
  flatListRef,
  onReply,
  onRetry,
  scrollToBottom,
  onScroll,
  scrollEventThrottle,
  onUnsend,
}: MessageListProps) => {
  const { user } = useProfile();
  const currentUsername = user?.username || '';

  // flatten all messages for replyTo enrichment (sort from oldest to newest)
  const allMessages = useMemo(() => {
    const flattened = messages.flat();
    
    // Use a Map to deduplicate messages by ID
    const uniqueMessages = new Map();
    
    // Process messages from oldest to newest, so newer duplicates will overwrite older ones
    flattened
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(msg => {
        if (msg?.id) {
          uniqueMessages.set(msg.id, msg);
        }
      });
    
    // Convert back to array and sort again to ensure correct order
    return Array.from(uniqueMessages.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  // DEBUG: log messages ที่จะ render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[MessageList] messages to render:', allMessages);
    }
  }, [allMessages]);

  // ฟังก์ชัน scroll ไปยังข้อความต้นทาง
  const handleReplyPreviewClick = (replyToId: string) => {
    const flat = allMessages;
    const index = flat.findIndex(m => m.id === replyToId);
    if (index !== -1 && flatListRef.current) {
      // Scroll to the message group containing the replyToId
      const el = flatListRef.current.querySelector(`[data-message-id="${replyToId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
      {typing && typing.length > 0 && (
        <TypingIndicator typingUsers={typing} />
      )}
    </div>
  );
};

export default MessageList; 