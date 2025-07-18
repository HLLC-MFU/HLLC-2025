import { formatDistanceToNow } from 'date-fns';
// import { th } from 'date-fns/locale';

export const formatTime = (timestamp: string): string => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    // If today, just show time
    if (new Date().toDateString() === date.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show relative time in English
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    console.error('Error formatting time:', e);
    return '';
  }
};

export default {
  formatTime
}; 