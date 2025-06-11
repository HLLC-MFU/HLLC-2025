interface ChatNotificationPayload {
  from: string;
  userId: string;
  roomId: string;
  message: string;
  type: 'text' | 'image' | 'file';
}