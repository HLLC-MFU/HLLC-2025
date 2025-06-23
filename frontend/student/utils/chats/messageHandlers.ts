import { Message } from '../types/chatTypes';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import { ERROR_MESSAGES } from '../constants/chatConstants';
import { CHAT_BASE_URL } from '../config/chatConfig';

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

export const createTempMessage = (
  text: string,
  userId: string,
  replyTo?: Message
): Message => ({
  id: Date.now().toString(),
  text,
  senderId: userId,
  senderName: userId,
  type: 'message',
  timestamp: new Date().toISOString(),
  isRead: false,
  replyTo: replyTo ? {
    id: replyTo.id || '',
    text: replyTo.text || '',
    senderId: replyTo.senderId,
    senderName: replyTo.senderName,
  } : undefined,
  username: userId,
  isTemp: true
});

export const createFileMessage = (
  fileData: {
    _id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    user_id: string;
    timestamp: string;
  }
): Message => {
  // Construct the full file URL
  const fileUrl = fileData.file_url.startsWith('http') 
    ? fileData.file_url 
    : `${CHAT_BASE_URL}/api/uploads/${fileData.file_url}`;
  
  return {
    id: fileData._id,
    fileUrl: fileUrl,
    fileName: fileData.file_name,
    fileType: fileData.file_type,
    senderId: fileData.user_id,
    senderName: fileData.user_id,
    type: 'file',
    timestamp: fileData.timestamp,
    isRead: false,
    username: fileData.user_id,
    isTemp: true
  };
};

export default {
  triggerHapticFeedback,
  triggerSuccessHaptic,
  createTempMessage,
  createFileMessage
}; 