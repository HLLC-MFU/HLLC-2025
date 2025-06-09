import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MessageBubbleProps } from '../types/chatTypes';
import Avatar from './Avatar';
import { formatTime } from '../utils/timeUtils';
import { Reply } from 'lucide-react-native';
import { API_BASE_URL } from '../config/chatConfig';

const MessageBubble = memo(({ 
  message, 
  isMyMessage, 
  senderId, 
  senderName,
  isRead,
  showAvatar = true,
  isLastInGroup = true,
  isFirstInGroup = true,
  onReply,
}: MessageBubbleProps) => {
  const statusElement = isMyMessage && (
    <View style={styles.messageStatus}>
      <Text style={styles.messageStatusText}>
        {isRead ? 'อ่านแล้ว' : 'ส่งแล้ว'}
      </Text>
    </View>
  );

  const renderContent = () => {
    if (message.stickerId) {
      const stickerUrl = message.image?.startsWith('http') 
        ? message.image 
        : `${API_BASE_URL}/stickers/${message.image}`;
        
      return (
        <Image 
          source={{ uri: stickerUrl }} 
          style={styles.stickerImage}
          resizeMode="contain"
          onError={(e) => {
            console.error('Error loading sticker in message:', e.nativeEvent.error);
            // Try fallback URL
            const fallbackUrl = `${API_BASE_URL}/stickers/images/${message.image}`;
            console.log('Trying fallback sticker URL:', fallbackUrl);
            Image.prefetch(fallbackUrl).catch(err => 
              console.error('Fallback sticker load failed:', err)
            );
          }}
        />
      );
    }

    if (message.fileUrl) {
      if (message.fileType?.startsWith('image/')) {
        const imageUrl = message.fileUrl?.startsWith('http') 
          ? message.fileUrl 
          : `${API_BASE_URL}/uploads/${message.fileUrl}`;
          
        return (
          <TouchableOpacity 
            onPress={() => {
              // TODO: Implement image preview
              console.log('Preview image:', imageUrl);
            }}
          >
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.messageImage}
              resizeMode="cover"
              onError={(e) => {
                console.error('Error loading image in message:', e.nativeEvent.error);
                // Try fallback URL
                const fallbackUrl = `${API_BASE_URL}/uploads/images/${message.fileUrl}`;
                console.log('Trying fallback image URL:', fallbackUrl);
                Image.prefetch(fallbackUrl).catch(err => 
                  console.error('Fallback image load failed:', err)
                );
              }}
            />
          </TouchableOpacity>
        );
      }
      return (
        <View style={styles.fileContainer}>
          <Text style={styles.fileName}>{message.fileName || 'ไฟล์แนบ'}</Text>
        </View>
      );
    }

    return <Text style={styles.messageText}>{message.text}</Text>;
  };
  
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
          isLastInGroup && (isMyMessage ? styles.myLastBubble : styles.otherLastBubble),
          (message.stickerId || message.fileType === 'image') && styles.mediaBubble
        ]}>
          {message.replyTo && (
            <View style={styles.replyContainer}>
              <Reply size={14} color="#8E8E93" />
              <Text style={styles.replyText} numberOfLines={1}>
                {message.replyTo.text}
              </Text>
            </View>
          )}
          {renderContent()}
        </View>

        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => onReply && onReply(message)}
        >
          <Reply size={16} color="#8E8E93" />
        </TouchableOpacity>
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
  mediaBubble: {
    padding: 4,
    backgroundColor: 'transparent',
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
  replyButton: {
    padding: 8,
    opacity: 0.7,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  replyText: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  stickerImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
  },
  fileContainer: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
  },
});

export default MessageBubble; 