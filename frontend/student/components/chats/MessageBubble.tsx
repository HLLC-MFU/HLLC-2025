import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActionSheetIOS, Platform, Alert, TouchableWithoutFeedback, Pressable } from 'react-native';
import Avatar from './Avatar';
import { Reply } from 'lucide-react-native';
import { MessageBubbleProps } from '@/types/chatTypes';
import { CHAT_BASE_URL, API_BASE_URL,IMAGE_BASE_URL } from '@/configs/chats/chatConfig';
import { formatTime } from '@/utils/chats/timeUtils';
import ImagePreviewModal from './ImagePreviewModal';
import { apiRequest } from '@/utils/api';
import useProfile from '@/hooks/useProfile';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';


interface MessageBubbleEnrichedProps extends MessageBubbleProps {
  allMessages?: import('@/types/chatTypes').Message[];
  onReplyPreviewClick?: (replyToId: string) => void;
  currentUsername: string;
}

const MessageBubble = memo(({ 
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
  onUnsend, // <-- add this prop
}: Omit<MessageBubbleEnrichedProps, 'senderId' | 'senderName'> & { onUnsend?: (message: any) => void }) => {
  if (message && message.evoucherInfo) {
  }
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [claiming, setClaiming] = useState<{ [id: string]: boolean }>({});
  const [claimed, setClaimed] = useState<{ [id: string]: boolean }>({});

  // Reset modal state when it closes
  const handleCloseImagePreview = useCallback(() => {
    setShowImagePreview(false);
    // Small delay to ensure modal is fully closed before resetting URL
    setTimeout(() => {
      setPreviewImageUrl('');
    }, 100);
  }, []);

  const handleOpenImagePreview = useCallback((imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
  }, []);

  // Cleanup state when component unmounts
  useEffect(() => {
    return () => {
      setShowImagePreview(false);
      setPreviewImageUrl('');
    };
  }, []);

  // Handler for long press (unsend)
  const handleLongPress = useCallback(() => {
    // Use Boolean(message.isDeleted) for deleted state
    const isDeleted = Boolean((message as any).isDeleted);
    // Allow unsend for all message types (text, image, sticker, file, etc.)
    if (isMyMessage && !isDeleted && onUnsend) {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Unsend'],
            destructiveButtonIndex: 1,
            cancelButtonIndex: 0,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              onUnsend(message);
            }
          }
        );
      } else {
        Alert.alert(
          'Unsend Message',
          'Do you want to unsend this message?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unsend', style: 'destructive', onPress: () => onUnsend(message) },
          ]
        );
      }
    }
  }, [isMyMessage, message, onUnsend]);

  const { user } = useProfile();
  const userId = useMemo(() => user?.data?.[0]?._id, [user]);
  const { t } = useTranslation();
  const statusElement = useMemo(() => isMyMessage && (
    <View style={styles.messageStatus}>
      <Text style={styles.messageStatusText}>
        {isRead ? 'อ่านแล้ว' : 'ส่งแล้ว'}
      </Text>
    </View>
  ), [isMyMessage, isRead]);

  // Language detection (simple):
  const lang = useMemo(() => (typeof navigator !== 'undefined' && navigator.language?.startsWith('en')) ? 'en' : 'th', []);

  const getStickerImageUrl = useCallback((imagePath: string) => {
    // If imagePath is already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Otherwise, construct the full URL using CHAT_BASE_URL to avoid Authorization header
    const fullUrl = `${API_BASE_URL}/uploads/${imagePath}`;
    return fullUrl;
  }, []);

  const getMessageTextStyle = useCallback(() => {
    return [
      styles.messageText,
      !isMyMessage && { color: '#222' }, // ข้อความคนอื่นเป็นสีดำ
    ];
  }, [isMyMessage]);

  const renderWithMentions = useCallback((text: string, currentUsername: string) => {
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
  }, []);

  const renderContent = useCallback(() => {
    // Check for evoucher type
    if (message.type === 'evoucher' && message.evoucherInfo) {
      const isClaimed = claimed[message.id ?? ''] || false;
      const isClaiming = claiming[message.id ?? ''] || false;
      // Language selection: fallback to 'th' if not detected
      const displayLang = lang === 'en' ? 'en' : 'th';
      return (
        <View style={[styles.evoucherCard, isClaimed && styles.evoucherCardClaimed]}> 
          {/* Show sponsor image if present */}
          {message.evoucherInfo && message.evoucherInfo.sponsorImage && (
            <TouchableOpacity
              onPress={() => {
                const sponsorImg = message.evoucherInfo?.sponsorImage;
                if (!sponsorImg) return;
                const imgUrl = sponsorImg.startsWith('http')
                  ? sponsorImg
                  : `${IMAGE_BASE_URL}/uploads/${sponsorImg}`;
                handleOpenImagePreview(imgUrl);
              }}
              style={{ alignItems: 'center', marginBottom: 8 }}
            >
              <Image
                source={{
                  uri: message.evoucherInfo.sponsorImage.startsWith('http')
                    ? message.evoucherInfo.sponsorImage
                    : `${IMAGE_BASE_URL}/uploads/${message.evoucherInfo.sponsorImage}`,
                }}
                style={{ width: 80, height: 80, borderRadius: 12, marginBottom: 4 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
          <View style={styles.evoucherHeader}>
            <Text style={styles.evoucherIcon}>{isClaimed ? '🎉' : '🎟️'}</Text>
            <Text style={[styles.evoucherTitle, isClaimed && styles.evoucherTitleClaimed]}>
              {message.evoucherInfo.message[displayLang]}
            </Text>
          </View>
          {isClaimed ? (
            <View style={styles.claimedBox}>
              <Text style={styles.claimedText}>{t('evoucher.claimed', 'คุณได้รับ E-Voucher แล้ว!')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.evoucherButton}
              disabled={isClaimed || isClaiming}
              onPress={async () => {
                if (!message.evoucherInfo?.claimUrl || !userId) return;
                setClaiming(prev => ({ ...prev, [message.id ?? '']: true }));
                try {
                  const claimUrl = message.evoucherInfo.claimUrl;
                  
                  // Get token for authorization
                  const token = await SecureStore.getItemAsync("accessToken");
                  
                  const response = await fetch(claimUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { 'Authorization': `Bearer ${token.trim()}` } : {}),
                    },
                    body: JSON.stringify({ user: userId }),
                  });
                  
                  const responseData = await response.json();
                  
                  if (response.ok) {
                    setClaimed(prev => ({ ...prev, [message.id ?? '']: true }));
                  } else {
                    alert(responseData.message || 'Claim failed');
                  }
                } catch (e) {
                  alert('Claim failed');
                } finally {
                  setClaiming(prev => ({ ...prev, [message.id ?? '']: false }));
                }
              }}
            >
              <Text style={styles.evoucherButtonText}>
                {isClaiming
                  ? t('evoucher.claiming', 'กำลังเคลม...')
                  : t('evoucher.claim', 'กดเพื่อรับ E-Voucher')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Check for sticker by looking at image field and type
    if (message.image && (message.type === 'sticker' || message.stickerId)) {
      const imageUrl = getStickerImageUrl(message.image);
      return (
        <Pressable
          onPress={() => {
            handleOpenImagePreview(imageUrl);
          }}
          onLongPress={handleLongPress}
          delayLongPress={350}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.stickerImage}
            resizeMode="contain"
            onError={(error) => {
              console.error('Error loading sticker image:', error.nativeEvent.error);
            }}
          />
        </Pressable>
      );
    }

    if (message.fileUrl) {
      const isImage = message.fileType === 'image' ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileUrl);
      if (isImage) {
        return (
          <Pressable
            onPress={() => {
              if (message.fileUrl) {
                handleOpenImagePreview(message.fileUrl);
              }
            }}
            onLongPress={handleLongPress}
            delayLongPress={350}
          >
            <Image
              source={{ uri: message.fileUrl }}
              style={styles.messageImage}
              resizeMode="cover"
              onError={(error) => {
                console.error('Error loading image:', error.nativeEvent.error);
              }}
            />
          </Pressable>
        );
      }
      return (
        <Pressable onLongPress={handleLongPress} delayLongPress={350}>
          <View style={styles.fileContainer}>
            <Text style={styles.fileName}>{message.fileName}</Text>
          </View>
        </Pressable>
      );
    }

    return <Text style={getMessageTextStyle()}>{renderWithMentions(message.text || '', currentUsername)}</Text>;
  }, [message, claimed, claiming, lang, handleOpenImagePreview, handleLongPress, userId, t, currentUsername, getStickerImageUrl, getMessageTextStyle, renderWithMentions]);
  
  const enrichedReplyTo = useMemo(() => {
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
          user: found.user, // เพิ่ม user data จาก found message
        };
      }
      return { ...replyTo, notFound: true };
    }
    return replyTo;
  }, [message.replyTo?.id, message.replyTo?.text, allMessages, message.replyTo]);

  const getDisplayName = useCallback((user?: { name?: { first?: string; last?: string } }) => {
    if (!user || !user.name) return '';
    return `${user.name.first || ''} ${user.name.last || ''}`.trim();
  }, []);

  const renderReplyPreview = useCallback(() => {
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
            ? `You replied to ${getDisplayName(enrichedReplyTo.user) || 'Unknown'}`
            : `${getDisplayName(message.user) || 'Someone'} replied to ${getDisplayName(enrichedReplyTo.user) || 'Unknown'}`}
        </Text>
        <View style={isMyMessage ? styles.replyPreviewBoxMine : styles.replyPreviewBoxOther}>
          {enrichedReplyTo.type === 'file' && enrichedReplyTo.fileType === 'image' && enrichedReplyTo.image && (
            <TouchableOpacity 
              onPress={() => {
                if (enrichedReplyTo.image) {
                  handleOpenImagePreview(enrichedReplyTo.image);
                }
              }}
            >
              <Image source={{ uri: enrichedReplyTo.image }} style={styles.replyImage} />
            </TouchableOpacity>
          )}
          {enrichedReplyTo.type === 'sticker' && enrichedReplyTo.image && (
            <TouchableOpacity 
              onPress={() => {
                if (enrichedReplyTo.image) {
                  handleOpenImagePreview(enrichedReplyTo.image);
                }
              }}
            >
              <Image source={{ uri: enrichedReplyTo.image }} style={styles.replySticker} />
            </TouchableOpacity>
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
  }, [enrichedReplyTo, isMyMessage, message, onReplyPreviewClick, handleOpenImagePreview, currentUsername, getDisplayName, enrichedReplyTo]);

  return (
    <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={350}>
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
        <View style={styles.messageBubbleRow}>
          {!isMyMessage && showAvatar && isLastInGroup ? (
            <Avatar name={getDisplayName(message.user)} size={32} />
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
        </View>
        {isLastInGroup && (
          <View style={[styles.messageFooter, isMyMessage ? { alignSelf: 'flex-end' } : { marginLeft: 40 }]}> 
            <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
            {statusElement}
          </View>
        )}
        {/* Image Preview Modal */}
        {useMemo(() => (
          <ImagePreviewModal
            key={previewImageUrl} // Force re-render when imageUrl changes
            visible={showImagePreview}
            imageUrl={previewImageUrl}
            onClose={handleCloseImagePreview}
          />
        ), [showImagePreview, previewImageUrl, handleCloseImagePreview])}
      </View>
    </TouchableWithoutFeedback>
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
    maxWidth: '100%', // จำกัดความกว้างสูงสุด
  },
  otherMessage: { 
    alignSelf: 'flex-start',
    marginRight: 40,
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '100%', // จำกัดความกว้างสูงสุด
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    width: '100%', // ให้ใช้พื้นที่เต็ม
  },
  messageBubble: { 
    maxWidth: '80%',
    minWidth: 20, // ขั้นต่ำสุดสำหรับ bubble
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginBottom: 2,
    alignSelf: 'flex-start', // ให้ bubble ขยายตามเนื้อหา
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
    textAlign: 'left', // จัดข้อความชิดซ้าย
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
    minWidth: 20, // ขั้นต่ำสุดสำหรับ reply preview
    alignSelf: 'flex-start', // ให้ขยายตามเนื้อหา
  },
  replyLabel: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 2,
    flexWrap: 'wrap', // ให้ข้อความ wrap ได้
    flexShrink: 1, // ให้หดตัวได้
  },
  replyPreviewBoxMine: {
    backgroundColor: '#ffffff70',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: -12,
    justifyContent: 'center',
    minWidth: 20, // ขั้นต่ำสุด
    alignSelf: 'flex-end', // ขยายตามเนื้อหา
  },
  replyPreviewBoxOther: {
    backgroundColor: '#ffffff70',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 40,
    marginBottom: -12,
    justifyContent: 'center',
    minWidth: 60, // ขั้นต่ำสุด
    alignSelf: 'flex-start', // ขยายตามเนื้อหา
  },
  replyText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '400',
    flexWrap: 'wrap', // ให้ข้อความ wrap ได้
    flexShrink: 1, // ให้หดตัวได้
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
  evoucherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#ffe066',
    padding: 18,
    marginVertical: 6,
    shadowColor: '#ffe066',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minWidth: 220,
    maxWidth: 300,
  },
  evoucherCardClaimed: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  evoucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  evoucherIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  evoucherTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#b8860b',
  },
  evoucherTitleClaimed: {
    color: '#22c55e',
  },
  evoucherDescription: {
    fontSize: 15,
    color: '#7c6f00',
    marginBottom: 14,
  },
  evoucherButton: {
    backgroundColor: '#ffe066',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: 6,
    shadowColor: '#ffe066',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 1,
  },
  evoucherButtonText: {
    color: '#b8860b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  claimedBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 10,
    alignItems: 'center',
  },
  claimedText: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MessageBubble; 