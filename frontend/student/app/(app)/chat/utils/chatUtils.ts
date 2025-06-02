import { Message } from '../types/chatTypes';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

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
): Message => ({
  id: fileData._id,
  fileUrl: fileData.file_url,
  fileName: fileData.file_name,
  fileType: fileData.file_type,
  senderId: fileData.user_id,
  senderName: fileData.user_id,
  type: 'file',
  timestamp: fileData.timestamp,
  isRead: false,
});

export default {
  triggerHapticFeedback,
  triggerSuccessHaptic,
  createTempMessage,
  createFileMessage,
}; 