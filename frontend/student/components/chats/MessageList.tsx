import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import SwipeableMessageBubble from './SwipeableMessageBubble';
import SystemMessage from './SystemMessage';
import TypingIndicator from './TypingIndicator';
import { Message } from '@/types/chatTypes';
import useProfile from '@/hooks/useProfile';

interface MessageListProps {
  messages: Message[][];
  userId: string;
  typing: { id: string; name?: string }[];
  flatListRef: React.RefObject<FlatList | null>;
  onReply: (message: Message) => void;
  onRetry?: (message: Message) => void;
  scrollToBottom: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  onUnsend?: (message: Message) => void; // <-- add this
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
  onUnsend, // <-- add this
}: MessageListProps) => {
  const { user } = useProfile();
  const currentUsername = user?.data?.[0]?.username || '';

  // flatten all messages for replyTo enrichment (sort จากเก่าไปใหม่)
  const allMessages = useMemo(() => {
    return messages
      .flat()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  // ฟังก์ชัน scroll ไปยังข้อความต้นทาง
  const handleReplyPreviewClick = (replyToId: string) => {
    const flat = allMessages;
    const index = flat.findIndex(m => m.id === replyToId);
    if (index !== -1 && flatListRef.current) {
      // หา group index และ message index ใน group
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
      // scroll ไปยัง group index (FlatList)
      flatListRef.current.scrollToIndex({ index: groupIdx, animated: true });
    }
  };

  const renderItem = ({ item }: { item: Message[] }) => {
    if (item.length === 1 && (item[0].type === 'join' || item[0].type === 'leave')) {
      return <SystemMessage text={item[0].text || ''} timestamp={item[0].timestamp} />;
    }
    return (
      <View style={styles.messageGroup}>
        {item.map((message: Message, index: number) => {
          if (
            !message ||
            !message.id ||
            !message.type ||
            !message.timestamp
          ) {
            console.warn('Invalid message format:', message);
            return (
              <View key={`invalid-${index}`} style={{ padding: 8, backgroundColor: '#fdd', borderRadius: 8, marginBottom: 4 }}>
                <Text style={{ color: '#900', fontSize: 14 }}>Invalid message format</Text>
              </View>
            );
          }
          const isMyMessage = message.user?._id === userId;
          const isLastInGroup = index === item.length - 1;
          const isFirstInGroup = index === 0;
          const senderName = message.user ? `${message.user.name?.first || ''} ${message.user.name?.last || ''}`.trim() : '';
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
      </View>
    );
  };

  const keyExtractor = (item: Message[], idx: number) => {
    if (item.length === 1) {
      return item[0].id ?? `group-${idx}`;
    }
    return `group-${idx}`;
  };

  return (
    <>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        onEndReachedThreshold={0.5}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      />
    </>
  );
};

const styles = StyleSheet.create({
  messageGroup: {
    marginBottom: 8,
  },
  messagesContent: { 
    padding: 16, 
  },
});

export default MessageList; 