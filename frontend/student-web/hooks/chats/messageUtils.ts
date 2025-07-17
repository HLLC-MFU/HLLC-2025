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
  // เพิ่ม log ข้อมูล input
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[createMessage] raw data:', JSON.parse(JSON.stringify(data)));
  }
  if (data.file_url) {
    const fileUrl = data.file_url.startsWith('http') 
      ? data.file_url 
      : `${CHAT_BASE_URL}/uploads/${data.file_url}`;
    const msg = {
      ...baseMessage,
      fileUrl,
      fileName: data.file_name,
      fileType: data.file_type,
      type: 'file' as const,
      username: data.username || data.senderName || data.user_id || data.userId || '',
      text: data.text || '[no text]'
    };
    if (typeof window !== 'undefined') {
      console.log('[createMessage] file message:', msg);
    }
    return msg;
  }
  if (data.stickerId || (data.image && !data.message)) {
    const msg = {
      ...baseMessage,
      image: data.image,
      stickerId: data.stickerId,
      type: 'sticker' as const,
      username: data.username || data.senderName || data.user_id || data.userId || '',
      text: data.text || '[sticker]'
    };
    if (typeof window !== 'undefined') {
      console.log('[createMessage] sticker message:', msg);
    }
    return msg;
  }
  let messageContent = data.message;
  // Expo-style: If messageContent is a stringified JSON, parse and extract payload.message recursively
  let parseDepth = 0;
  while (typeof messageContent === 'string' && messageContent.trim().startsWith('{') && messageContent.trim().endsWith('}') && parseDepth < 3) {
    try {
      const parsed = JSON.parse(messageContent);
      if (parsed && typeof parsed === 'object') {
        if (parsed.payload && parsed.payload.message) {
          messageContent = parsed.payload.message;
        } else if (parsed.message) {
          messageContent = parsed.message;
        } else {
          break;
        }
      } else if (typeof parsed === 'string') {
        messageContent = parsed;
      } else {
        break;
      }
      parseDepth++;
    } catch (e) {
      break;
    }
  }
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
    const msg = {
      ...baseMessage,
      type: 'evoucher' as const,
      evoucherInfo: data.evoucherInfo,
      text: data.message || (data.evoucherInfo.message && (data.evoucherInfo.message.en || data.evoucherInfo.message.th)) || '[evoucher]',
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
    if (typeof window !== 'undefined') {
      console.log('[createMessage] evoucher message:', msg);
    }
    return msg;
  }
  if (data.type === 'evoucher') {
    const msg = {
      ...baseMessage,
      type: 'evoucher' as const,
      evoucherInfo: data.evoucherInfo,
      text: data.message || (data.evoucherInfo && data.evoucherInfo.message && (data.evoucherInfo.message.en || data.evoucherInfo.message.th)) || '[evoucher]',
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
    if (typeof window !== 'undefined') {
      console.log('[createMessage] evoucher message (type):', msg);
    }
    return msg;
  }
  // mention, upload, reply, message ปกติ
  const msg = {
    ...baseMessage,
    text: messageContent || data.text || '[no text]',
    type: (data.type || 'message') as any,
    replyTo,
    username: data.username || data.senderName || data.user_id || data.userId || ''
  };
  if (typeof window !== 'undefined') {
    console.log('[createMessage] default message:', msg);
  }
  return msg;
} 
