import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessageBubbleProps } from '../types/chatTypes';
import Avatar from './Avatar';
import { formatTime } from '../utils/timeUtils';

const MessageBubble = memo(({ 
  message, 
  isMyMessage, 
  senderId, 
  senderName,
  isRead,
  showAvatar = true,
  isLastInGroup = true,
  isFirstInGroup = true,
}: MessageBubbleProps) => {
  const statusElement = isMyMessage && (
    <View style={styles.messageStatus}>
      <Text style={styles.messageStatusText}>
        {isRead ? 'อ่านแล้ว' : 'ส่งแล้ว'}
      </Text>
    </View>
  );
  
  return (
    <View style={[
      styles.messageWrapper, 
      isMyMessage ? styles.myMessage : styles.otherMessage,
      !isLastInGroup && (isMyMessage ? { marginBottom: 2 } : { marginBottom: 2 })
    ]}>
      {!isMyMessage && isFirstInGroup && (
        <Text style={styles.senderNameAbove}>{senderName || senderId}</Text>
      )}
      
      <View style={styles.messageBubbleRow}>
        {!isMyMessage && showAvatar && isLastInGroup ? (
          <Avatar name={senderName || senderId} size={32} />
        ) : (
          !isMyMessage && <View style={{ width: 40 }} />
        )}
        
        <View style={[
          styles.messageBubble, 
          isMyMessage ? styles.myBubble : styles.otherBubble,
          isFirstInGroup && (isMyMessage ? styles.myFirstBubble : styles.otherFirstBubble),
          isLastInGroup && (isMyMessage ? styles.myLastBubble : styles.otherLastBubble)
        ]}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      </View>
      
      {isLastInGroup && (
        <View style={[styles.messageFooter, isMyMessage ? { alignSelf: 'flex-end' } : { marginLeft: 40 }]}>
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
          {statusElement}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  messageWrapper: { 
    marginVertical: 2,
    maxWidth: '100%',
    flexDirection: 'column',
  },
  myMessage: { 
    alignSelf: 'flex-end',
    marginLeft: 40,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  otherMessage: { 
    alignSelf: 'flex-start',
    marginRight: 40,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  messageBubble: { 
    maxWidth: '80%',
    paddingVertical: 8,
    paddingHorizontal: 12, 
    borderRadius: 18,
    marginBottom: 2,
  },
  myBubble: { 
    backgroundColor: '#0A84FF',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  otherBubble: { 
    backgroundColor: '#333',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 18,
  },
  myFirstBubble: {
    borderTopRightRadius: 18,
  },
  myLastBubble: {
    borderBottomRightRadius: 18,
  },
  otherFirstBubble: {
    borderTopLeftRadius: 18,
  },
  otherLastBubble: {
    borderBottomLeftRadius: 18,
  },
  messageText: { 
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  senderNameAbove: { 
    color: '#0A84FF', 
    fontSize: 12, 
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 40,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  messageStatus: {
    marginLeft: 6,
  },
  messageStatusText: {
    color: '#8E8E93',
    fontSize: 10,
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 10,
  },
});

export default MessageBubble; 