import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Avatar from './Avatar';
import { Reply } from 'lucide-react-native';
import { MessageBubbleProps } from '@/types/chatTypes';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import { formatTime } from '@/utils/chats/timeUtils';


interface MessageBubbleEnrichedProps extends MessageBubbleProps {
  allMessages?: import('@/types/chatTypes').Message[];
  onReplyPreviewClick?: (replyToId: string) => void;
  currentUsername: string;
}

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
  allMessages = [],
  onReplyPreviewClick,
  currentUsername,
}: MessageBubbleEnrichedProps) => {
  const statusElement = isMyMessage && (
    <View style={styles.messageStatus}>
      <Text style={styles.messageStatusText}>
        {isRead ? 'อ่านแล้ว' : 'ส่งแล้ว'}
      </Text>
    </View>
  );

  const getStickerImageUrl = (imagePath: string) => {
    // If imagePath is already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Otherwise, construct the full URL
    const fullUrl = `${CHAT_BASE_URL}/api/uploads/${imagePath}`;
    return fullUrl;
  };

  const getMessageTextStyle = () => {
    return [
      styles.messageText,
      !isMyMessage && { color: '#222' }, // ข้อความคนอื่นเป็นสีดำ
    ];
  };

  const renderWithMentions = (text: string, currentUsername: string) => {
    if (!text) return null;
    const regex = /(@\w+)/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        const mention = part.slice(1);
        const isMatch = mention === currentUsername;
        if (isMatch) {
          return (
            <Text key={i} style={{ color: '#0A84FF', fontWeight: 'bold' }}>{part}</Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  const renderContent = () => {
    // Check for sticker by looking at image field and type
    if (message.image && (message.type === 'sticker' || message.stickerId)) {
      const imageUrl = getStickerImageUrl(message.image);
      return (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.stickerImage}
          resizeMode="contain"
          onError={(error) => {
            console.error('Error loading sticker image:', error.nativeEvent.error);
          }}
        />
      );
    }

    if (message.fileUrl) {
      if (message.fileType === 'image') {
        return (
          <TouchableOpacity 
            onPress={() => {
              // TODO: Implement image preview
            }}
          >
            <Image 
              source={{ uri: message.fileUrl }} 
              style={styles.messageImage}
              resizeMode="cover"
              onError={(error) => {
                console.error('Error loading image:', error.nativeEvent.error);
              }}
            />
          </TouchableOpacity>
        );
      }
      return (
        <View style={styles.fileContainer}>
          <Text style={styles.fileName}>{message.fileName}</Text>
        </View>
      );
    }

    return <Text style={getMessageTextStyle()}>{renderWithMentions(message.text || '', currentUsername)}</Text>;
  };
  
  const enrichedReplyTo = React.useMemo(() => {
    const replyTo = message.replyTo || undefined;
    if (replyTo && replyTo.id) {
      const found = allMessages.find(m => m.id === replyTo.id);
      if (found) {
        return {
          ...replyTo,
          type: found.type,
          text: found.text || '',
          image: found.image,
          fileName: found.fileName,
          fileType: found.fileType,
          stickerId: found.stickerId,
          senderName: found.senderName || found.username || '',
        };
      }
      return { ...replyTo, notFound: true };
    }
    return replyTo;
  }, [message.replyTo?.id, message.replyTo?.text, message.replyTo?.senderName, allMessages]);

  const renderReplyPreview = () => {
    if (!enrichedReplyTo) return null;
    return (
      <TouchableOpacity
        onPress={() => {
          if (!enrichedReplyTo.notFound && onReplyPreviewClick) {
            onReplyPreviewClick(enrichedReplyTo.id);
          }
        }}
        activeOpacity={0.8}
        style={styles.replyPreviewContainer}
      >
        <Text style={styles.replyLabel}>
          {isMyMessage
            ? `You replied to ${enrichedReplyTo.senderName || 'Unknown'}`
            : `${senderName || 'Someone'} replied to ${enrichedReplyTo.senderName || 'Unknown'}`}
        </Text>
        <View style={isMyMessage ? styles.replyPreviewBoxMine : styles.replyPreviewBoxOther}>
          {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType === 'image' && enrichedReplyTo.image && (
            <Image source={{ uri: enrichedReplyTo.image }} style={styles.replyImage} />
          )}
          {enrichedReplyTo.type === 'sticker' && enrichedReplyTo.image && (
            <Image source={{ uri: enrichedReplyTo.image }} style={styles.replySticker} />
          )}
          {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType !== 'image' && (
            <Text style={styles.replyFile}>{enrichedReplyTo.fileName}</Text>
          )}
          {enrichedReplyTo.type === 'message' && (
            <Text style={styles.replyText}>
              {renderWithMentions(enrichedReplyTo.text || '', currentUsername)}
            </Text>
          )}
          {enrichedReplyTo.notFound && (
            <Text style={styles.replyText}>[ไม่พบข้อความต้นฉบับ]</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.messageWrapper,
        isMyMessage ? styles.myMessage : styles.otherMessage,
        !isLastInGroup && (isMyMessage ? { marginBottom: 2 } : { marginBottom: 2 }),
      ]}
    >
      {/* กล่อง preview แยกออกมา */}
      {renderReplyPreview()}

      {/* กล่องข้อความหลัก */}
      <TouchableOpacity
        style={styles.messageBubbleRow}
        onLongPress={() => {
          // ป้องกัน reply ถึงข้อความที่ยัง pending
          if (message.isTemp || (message.id && message.id.startsWith('msg-'))) {
            alert('กรุณารอให้ข้อความนี้ถูกส่งสำเร็จก่อนจึงจะ reply ได้');
            return;
          }
          onReply && onReply(message);
        }}
        activeOpacity={0.8}
        delayLongPress={200}
      >
        {!isMyMessage && showAvatar && isLastInGroup ? (
          <Avatar name={senderName || senderId} size={32} />
        ) : (
          !isMyMessage && <View style={{ width: 40 }} />
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myBubble : styles.otherBubble,
            isFirstInGroup && (isMyMessage ? styles.myFirstBubble : styles.otherFirstBubble),
            isLastInGroup && (isMyMessage ? styles.myLastBubble : styles.otherLastBubble),
            (message.stickerId || message.image || message.fileType === 'image') && styles.mediaBubble,
          ]}
        >
          {renderContent()}
        </View>
      </TouchableOpacity>

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
    backgroundColor: '#E0E0E0',
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
  replyPreviewContainer: {
    marginBottom: 6,
    maxWidth: '80%',
  },
  replyLabel: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 2,
  },
  replyPreviewBoxMine: {
    backgroundColor: '#ffffff70',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: -12,
    justifyContent: 'center',
  },
  replyPreviewBoxOther: {
    backgroundColor: '#ffffff70',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 40,
    marginBottom: -12,
    justifyContent: 'center',
  },
  replyText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '400',
  },
  replyImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  replySticker: {
    width: 36,
    height: 36,
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  replyFile: {
    color: '#fff',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
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