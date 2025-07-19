import { CHAT_BASE_URL } from '../../configs/chats/chatConfig';
import { createFileMessage } from '@/utils/chats/messageHandlers';
import { Message } from '../../types/chat';
import { getToken } from '@/utils/storage';

export function safeUser(userObj: any) {
  if (!userObj) return { _id: '', name: { first: '', middle: '', last: '' }, username: '' };
  return {
    _id: userObj._id || userObj.user_id || '',
    name: {
      first: userObj.name?.first || '',
      middle: userObj.name?.middle || '',
      last: userObj.name?.last || '',
    },
    username: userObj.username || '',
  };
}

export function createMessage(data: any, isHistory = false): Message {
  if (!data) {
    console.warn('createMessage called with null data');
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user: { _id: '', name: { first: '', middle: '', last: '' }, username: '' },
      type: 'message',
      timestamp: new Date().toISOString(),
      isRead: false,
      isTemp: false,
      text: '',
      username: ''
    };
  }

  // Debug logging for evoucher messages
  if (data.type === 'evoucher') {
    console.log('[DEBUG][createMessage] 🏗️  Creating evoucher message with data:', {
      type: data.type,
      hasPayload: !!data.payload,
      hasEvoucherInfo: !!data.evoucherInfo,
      dataKeys: Object.keys(data),
      payloadKeys: data.payload ? Object.keys(data.payload) : []
    });
  }

  const id = data.id || data._id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const baseMessage = {
    id,
    user: safeUser(data.user),
    timestamp: data.timestamp || new Date().toISOString(),
    isRead: false,
    isTemp: false
  };

  // ถ้า data เป็น string ให้สร้าง message ปกติ
  if (typeof data === 'string') {
    return {
      ...baseMessage,
      text: data,
      type: 'message' as const,
      username: '', // กำหนด username เป็น string ว่าง
    };
  }

  if (data.file_url) {
    const fileUrl = data.file_url.startsWith('http') 
      ? data.file_url 
      : `${CHAT_BASE_URL}/uploads/${data.file_url}`;
    return {
      ...baseMessage,
      fileUrl,
      fileName: data.file_name,
      fileType: data.file_type,
      type: 'file' as const,
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
  }

  if (data.stickerId || (data.image && !data.message)) {
    return {
      ...baseMessage,
      image: data.image,
      stickerId: data.stickerId,
      type: 'sticker' as const,
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
  }

  let messageContent = data.message;
  let replyTo = undefined;
  if (data.replyTo) {
    replyTo = {
      id: String(
        data.replyTo.id ||
        (data.replyTo.message && (data.replyTo.message._id || data.replyTo.message.id)) ||
        data.reply_to_id ||
        ''
      ),
      text: String(
        data.replyTo.text ||
        (data.replyTo.message && (data.replyTo.message.message || data.replyTo.message.text)) ||
        ''
      ),
      user: data.replyTo.user ? safeUser(data.replyTo.user) : undefined,
    };
  } else if (data.reply_to_id) {
    replyTo = {
      id: String(data.reply_to_id),
      text: '',
      user: undefined,
    };
  }

  // Handle evoucher messages - check both direct evoucherInfo and payload.evoucherInfo
  if (data.evoucherInfo || (data.payload && data.payload.evoucherInfo) || data.type === 'evoucher') {
    // Get evoucherInfo from the most appropriate source
    const evoucherInfo = data.evoucherInfo || (data.payload && data.payload.evoucherInfo) || {};
    
    // Get message text from multiple possible sources
    const messageText = data.message || 
      (evoucherInfo.message && (evoucherInfo.message.en || evoucherInfo.message.th)) ||
      '';

    const evoucherMessage = {
      ...baseMessage,
      type: 'evoucher' as const,
      evoucherInfo,
      text: messageText,
      username: data.username || data.senderName || data.user_id || data.userId || '',
      // Include payload if it exists for backward compatibility
      ...(data.payload && { payload: data.payload })
    };

    // Debug logging for evoucher message creation
    if (data.type === 'evoucher') {
      console.log('[DEBUG][createMessage] ✅ Created evoucher message:', {
        id: evoucherMessage.id,
        hasEvoucherInfo: !!evoucherMessage.evoucherInfo,
        evoucherInfoKeys: Object.keys(evoucherMessage.evoucherInfo || {}),
        hasPayloadEvoucherInfo: !!(data.payload && data.payload.evoucherInfo),
        messageText: evoucherMessage.text,
        messageType: evoucherMessage.type
      });
    }

    return evoucherMessage;
  }

  return {
    ...baseMessage,
    text: messageContent,
    type: 'message' as const,
    replyTo,
    username: data.username || data.senderName || data.user_id || data.userId || ''
  };
} 
