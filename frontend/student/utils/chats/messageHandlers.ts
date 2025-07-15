import { CHAT_BASE_URL, API_BASE_URL } from "@/configs/chats/chatConfig";
import { Message } from "@/types/chatTypes";
import { Platform, Vibration } from "react-native";
import * as Haptics from 'expo-haptics';

export const triggerHapticFeedback = () => {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else {
    Vibration.vibrate(50);
  }
};

export const triggerSuccessHaptic = () => {
  if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Vibration.vibrate([0, 50, 100, 50]);
  }
};

const safeUser = (userObj: any) => {
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
};

export const createTempMessage = (
  text: string,
  user: { _id: string; name: { first: string; middle: string; last: string }; username: string },
  replyTo?: Message
): Message => ({
  id: Date.now().toString(),
  text,
  user: safeUser(user),
  type: 'message',
  timestamp: new Date().toISOString(),
  isRead: false,
  replyTo: replyTo ? {
    id: replyTo.id || '',
    text: replyTo.text || '',
    user: safeUser(replyTo.user),
  } : undefined,
  isTemp: true
});

export const createFileMessage = (
  fileData: any,
  user: { _id: string; name: { first: string; middle: string; last: string }; username: string }
): Message | null => {
  let fileUrl = '';
  let fileName = '';
  let fileType = '';
  let id = '';
  let timestamp = '';

  function normalizePath(path: string) {
    if (path.startsWith('uploads/')) {
      return path.replace(/^uploads\//, '');
    }
    return path;
  }

  if (fileData.file && fileData.message && fileData.user) {
    fileName = typeof fileData.file === 'string' ? fileData.file : fileData.file.path || '';
    fileUrl = fileName.startsWith('http')
      ? fileName
      : `${API_BASE_URL}/uploads/${fileName.replace(/^uploads\//, '')}`;
    id = fileData.message._id || fileData.message.id || '';
    timestamp = fileData.timestamp || fileData.message.timestamp || new Date().toISOString();
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : '';
  } else {
    if (fileData.file_url) {
      let path = fileData.file_url;
      path = normalizePath(path);
      fileUrl = path.startsWith('http')
        ? path
        : `${API_BASE_URL}/uploads/${path}`;
    } else if (fileData.image) {
      let path = fileData.image;
      path = normalizePath(path);
      fileUrl = path.startsWith('http')
        ? path
        : `${API_BASE_URL}/uploads/${path}`;
    } else if (fileData.file && fileData.file.path) {
      let path = fileData.file.path;
      path = normalizePath(path);
      fileUrl = path.startsWith('http')
        ? path
        : `${API_BASE_URL}/uploads/${path}`;
    } else if (fileData.filename) {
      fileUrl = `${API_BASE_URL}/uploads/${fileData.filename}`;
    } else if (typeof fileData.file === 'string') {
      let path = normalizePath(fileData.file);
      fileUrl = path.startsWith('http')
        ? path
        : `${API_BASE_URL}/uploads/${path}`;
    } else {
      fileUrl = '';
    }
    fileName = fileData.file_name || fileData.filename || (typeof fileData.file === 'string' ? fileData.file : '') || '';
    fileType = fileData.file_type || (
      /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)
        ? 'image'
        : ''
    );
    id = fileData._id || fileData.id || (fileData.message && (fileData.message._id || fileData.message.id)) || '';
    timestamp = fileData.timestamp || (fileData.message && fileData.message.timestamp) || new Date().toISOString();
  }

  if (!fileUrl || !fileName || !id || !timestamp) {
    return null;
  }

  return {
    id,
    fileUrl,
    fileName,
    fileType,
    user: safeUser(user),
    type: 'file',
    timestamp,
    isRead: false,
    isTemp: false,
  };
};

export default {
  triggerHapticFeedback,
  triggerSuccessHaptic,
  createTempMessage,
  createFileMessage
}; 