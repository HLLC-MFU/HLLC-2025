import { useCallback } from 'react';
import { Message } from '../types/chatTypes';
import { ERROR_MESSAGES } from '../constants/chatConstants';
import { createTempMessage, triggerHapticFeedback } from '../utils/chatUtils';

export const useMessages = (
  userId: string,
  wsSendMessage: (message: string) => void,
  addMessage: (message: Message) => void,
  scrollToBottom: () => void
) => {
  const handleSendMessage = useCallback(async (
    messageText: string,
    replyTo?: Message | null,
    setMessageText?: (text: string) => void,
    setReplyTo?: (message: Message | null) => void
  ) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) return;
    
    try {
      console.log('Sending message:', trimmedMessage);
      
      // Create temporary message for immediate display
      const tempMessage = createTempMessage(trimmedMessage, userId, replyTo || undefined);

      // Add message to WebSocket messages immediately
      addMessage(tempMessage);
      
      // Send message via WebSocket
      if (replyTo) {
        wsSendMessage(`/reply ${replyTo.id} ${trimmedMessage}`);
      } else {
        wsSendMessage(trimmedMessage);
      }
      
      // Clear input and reply after sending
      if (setMessageText) setMessageText('');
      if (setReplyTo) setReplyTo(null);
      
      // Scroll to bottom after sending
      scrollToBottom();
      
      triggerHapticFeedback();
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(ERROR_MESSAGES.SEND_FAILED);
    }
  }, [userId, wsSendMessage, addMessage, scrollToBottom]);

  return {
    handleSendMessage,
  };
}; 