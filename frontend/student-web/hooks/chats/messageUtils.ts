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
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 9)}`,
      user: { _id: '', name: { first: '', middle: '', last: '' }, username: '' },
      type: 'message',
      timestamp: new Date().toISOString(),
      isRead: false,
      isTemp: false,
      text: '',
      username: ''
    };
  }



  // Generate more unique ID
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 9);
    return `msg-${timestamp}-${random1}-${random2}`;
  };

  // Ensure we have a unique ID, especially for messages from server
  let id = data.id || data._id;
  
  // For evoucher messages, prioritize message._id over other IDs
  if (data.type === 'evoucher' && data.message && data.message._id) {
    id = data.message._id;
  } else if (data.type === 'evoucher' && data.payload && data.payload.evoucherInfo && data.payload.evoucherInfo.message && data.payload.evoucherInfo.message._id) {
    // Fallback: check if evoucherInfo has message._id
    id = data.payload.evoucherInfo.message._id;
  }
  
  if (!id || id === 'undefined' || id === 'null') {
    id = generateUniqueId();
  }
  const baseMessage = {
    id,
    user: safeUser(data.user),
    timestamp: data.timestamp || new Date().toISOString(),
    isRead: false,
    isTemp: false
  };

  // Handle join/leave system messages
  if (data.type === 'join' || data.type === 'leave') {
    return {
      ...baseMessage,
      type: data.type as 'join' | 'leave',
      text: data.message || data.text || '',
      username: data.username || data.user?.username || ''
    };
  }

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
    // For evoucher replyTo, prioritize message._id
    let replyId = data.replyTo.id;
    if (data.replyTo.type === 'evoucher' && data.replyTo.message && data.replyTo.message._id) {
      replyId = data.replyTo.message._id;
    } else if (data.replyTo.message && (data.replyTo.message._id || data.replyTo.message.id)) {
      replyId = data.replyTo.message._id || data.replyTo.message.id;
    }
    
    replyTo = {
      id: String(replyId || data.reply_to_id || ''),
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
      replyTo, // Include replyTo for evoucher messages
      // Include payload if it exists for backward compatibility
      ...(data.payload && { payload: data.payload })
    };



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
