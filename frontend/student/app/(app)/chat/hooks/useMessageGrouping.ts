import { useCallback } from 'react';
import { Message } from '../types/chatTypes';

export const useMessageGrouping = (messages: Message[]) => {
  return useCallback(() => {
    let result: Message[][] = [];
    let currentGroup: Message[] = [];
    
    messages.forEach((message, index) => {
      if (message.type === 'join' || message.type === 'leave') {
        // If there's a current group, push it to results and start fresh
        if (currentGroup.length > 0) {
          result.push([...currentGroup]);
          currentGroup = [];
        }
        // Add system message as its own group
        result.push([message]);
      } else {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        
        // Start a new group if:
        // 1. This is the first message
        // 2. Previous message was a system message
        // 3. Current message is from a different sender than previous
        // 4. Messages are more than 5 minutes apart
        if (
          !prevMessage || 
          prevMessage.type === 'join' || 
          prevMessage.type === 'leave' ||
          prevMessage.senderId !== message.senderId ||
          (message.timestamp && prevMessage.timestamp && 
            new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 5 * 60 * 1000)
        ) {
          if (currentGroup.length > 0) {
            result.push([...currentGroup]);
            currentGroup = [];
          }
        }
        
        currentGroup.push(message);
      }
    });
    
    // Don't forget to add the last group
    if (currentGroup.length > 0) {
      result.push([...currentGroup]);
    }
    
    return result;
  }, [messages]);
}; 