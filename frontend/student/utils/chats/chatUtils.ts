import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import { CHAT_BASE_URL } from "@/configs/chats/chatConfig";
import { Message } from '@/types/chatTypes';

export const triggerHapticFeedback = () => {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else {
    Vibration.vibrate(80);
  }
};

export const triggerSuccessHaptic = () => {
  if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Vibration.vibrate(80);
  }
};

export const createTempMessage = (
  text: string,
  user: { _id: string; name: any; username: string },
  replyTo?: Message
): Message => ({
  id: Date.now().toString(),
  text,
  user,
  type: 'message',
  timestamp: new Date().toISOString(),
  isRead: false,
  replyTo: replyTo ? {
    id: replyTo.id || '',
    text: replyTo.text || '',
    user: replyTo.user,
  } : undefined,
  isTemp: true
});

export const createFileMessage = (
  fileData: any
): Message => {
  let fileUrl = '';
  let fileName = '';
  let fileType = '';
  let id = '';
  let senderId = '';
  let senderName = '';
  let username = '';
  let timestamp = '';

  if (fileData.file && fileData.message && fileData.user) {
    fileName = fileData.file;
    fileUrl = fileName.startsWith('http')
      ? fileName
      : `${CHAT_BASE_URL}/api/uploads/${fileName}`;
    id = fileData.message._id || fileData.message.id || '';
    senderId = fileData.user._id || '';
    senderName = fileData.user.name
      ? `${fileData.user.name.first || ''} ${fileData.user.name.last || ''}`.trim()
      : fileData.user.username || '';
    username = fileData.user.username || '';
    timestamp = fileData.timestamp || fileData.message.timestamp || new Date().toISOString();
    const ext = ((fileName ?? '') as string).split('.').pop()?.toLowerCase() || '';
    fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : '';
  } else {
    function normalizePath(path: string) {
      if (path.startsWith('uploads/')) {
        return path.replace(/^uploads\//, '');
      }
      return path;
    }
    if (fileData.file_url) {
      let path = fileData.file_url;
      path = normalizePath(path);
      fileUrl = path.startsWith('http')
        ? path
        : `${CHAT_BASE_URL}/api/uploads/${path}`;
    } else if (fileData.image) {
      let path = fileData.image;
      path = normalizePath(path);
      fileUrl = path.startsWith('http')
        ? path
        : `${CHAT_BASE_URL}/api/uploads/${path}`;
    } else if (fileData.file && fileData.file.path) {
      let path = fileData.file.path;
      path = normalizePath(path);
      fileUrl = path.startsWith('http')
        ? path
        : `${CHAT_BASE_URL}/api/uploads/${path}`;
    } else if (fileData.filename) {
      fileUrl = `${CHAT_BASE_URL}/api/uploads/${fileData.filename}`;
    } else {
      fileUrl = '';
    }
    fileName = fileData.file_name || fileData.filename || '';
    fileType = fileData.file_type || (
      /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)
        ? 'image'
        : ''
    );
    id = fileData._id || fileData.id || '';
    senderId = fileData.user_id || (fileData.user && fileData.user._id) || '';
    senderName = fileData.user && fileData.user.name
      ? `${fileData.user.name.first || ''} ${fileData.user.name.last || ''}`.trim()
      : fileData.user_id || (fileData.user && fileData.user._id) || '';
    username = fileData.user && fileData.user.username || '';
    timestamp = fileData.timestamp || new Date().toISOString();
  }

  return {
    id,
    fileUrl,
    fileName,
    fileType,
    user,
    type: 'file',
    timestamp,
    isRead: false,
    isTemp: false,
  };
};

export default {
  triggerHapticFeedback,
  triggerSuccessHaptic,
}; 