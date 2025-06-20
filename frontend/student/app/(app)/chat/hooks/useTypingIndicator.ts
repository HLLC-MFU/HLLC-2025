import { useState, useRef, useCallback } from 'react';

export const useTypingIndicator = () => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator through websocket
      // This is a placeholder for the actual implementation
      // wsSendTypingStatus(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // wsSendTypingStatus(false);
    }, 2000);
  }, [isTyping]);

  return {
    isTyping,
    handleTyping,
  };
};

export default useTypingIndicator; 