import { CHAT_BASE_URL } from '../../configs/chats/chatConfig';
import { Message } from '../../types/chat';

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
  const id = data.id || data._id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const baseMessage = {
    id,
    user: safeUser(data.user),
    timestamp: data.timestamp || new Date().toISOString(),
    isRead: false,
    isTemp: false
  };
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
  if (data.evoucherInfo) {
    return {
      ...baseMessage,
      type: 'evoucher' as const,
      evoucherInfo: data.evoucherInfo,
      text: data.message || (data.evoucherInfo.message && (data.evoucherInfo.message.en || data.evoucherInfo.message.th)) || '',
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
  }
  if (data.type === 'evoucher') {
    return {
      ...baseMessage,
      type: 'evoucher' as const,
      evoucherInfo: data.evoucherInfo,
      text: data.message || (data.evoucherInfo && data.evoucherInfo.message && (data.evoucherInfo.message.en || data.evoucherInfo.message.th)) || '',
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
  }
  return {
    ...baseMessage,
    text: messageContent,
    type: 'message' as const,
    replyTo,
    username: data.username || data.senderName || data.user_id || data.userId || ''
  };
} 
