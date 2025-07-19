import React, { memo } from 'react';
import { formatTime } from '@/utils/chats/timeUtils';

interface SystemMessageProps {
  text: string;
  timestamp?: string;
}

const SystemMessage = memo(({ text, timestamp }: SystemMessageProps) => (
  <div style={styles.systemMessageContainer}>
    <p style={styles.systemMessage}>{text}</p>
    {timestamp && <p style={styles.timestamp}>{formatTime(timestamp)}</p>}
  </div>
));

const styles: { [key: string]: React.CSSProperties } = {
  systemMessageContainer: {
    display: 'flex',
    alignItems: 'center',
    margin: '12px 0',
    opacity: 0.8,
  },
  systemMessage: {
    color: '#bbb',
    fontSize: '12px',
    backgroundColor: 'rgba(70, 70, 70, 0.5)',
    padding: '6px 12px',
    borderRadius: '12px',
    overflow: 'hidden',
    textAlign: 'center' as React.CSSProperties['textAlign'],
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: '10px',
    marginTop: '4px',
  },
};

export default SystemMessage;
