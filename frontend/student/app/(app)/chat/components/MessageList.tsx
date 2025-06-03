import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Message } from '../types/chatTypes';
import MessageBubble from './MessageBubble';
import SystemMessage from './SystemMessage';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[][];
  userId: string;
  typing: { id: string; name?: string }[];
  flatListRef: React.RefObject<FlatList>;
  onReply: (message: Message) => void;
  scrollToBottom: () => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  userId,
  typing,
  flatListRef,
  onReply,
  scrollToBottom,
}) => {
  const renderItem = ({ item }: { item: Message[] }) => {
    if (item.length === 1 && (item[0].type === 'join' || item[0].type === 'leave')) {
      return <SystemMessage text={item[0].text} timestamp={item[0].timestamp} />;
    }
    
    return (
      <View style={styles.messageGroup}>
        {item.map((message: Message, index: number) => {
          const isMyMessage = message.senderId === userId;
          const isLastInGroup = index === item.length - 1;
          const isFirstInGroup = index === 0;
          
          return (
            <MessageBubble 
              key={message.id || `msg-${index}`}
              message={message} 
              isMyMessage={isMyMessage} 
              senderId={message.senderId}
              senderName={message.senderName}
              isRead={message.isRead}
              showAvatar={!isMyMessage && isLastInGroup}
              isLastInGroup={isLastInGroup}
              isFirstInGroup={isFirstInGroup}
              onReply={onReply}
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
      />
      
      {typing && typing.length > 0 && (
        <TypingIndicator typingUsers={typing} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  messageGroup: {
    marginBottom: 8,
  },
  messagesContent: { 
    padding: 16, 
    paddingBottom: 80,
  },
});

export default MessageList; 