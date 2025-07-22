import React, { memo } from 'react';
import { formatTime } from '@/utils/chats/timeUtils';

interface SystemMessageProps {
  text: string;
  timestamp?: string;
}

const SystemMessage = memo(({ text, timestamp }: SystemMessageProps) => {
  // Custom rendering for MC room feedback
  if (text === 'ขอบคุณสำหรับคำถามของคุณ / Thank you for your feedback') {
    return (
      <div style={styles.mcSystemMessageContainerLeft}>
        <div style={styles.mcSystemMessageBubbleNeutral}>
          {/* <div style={{ fontSize: 28, marginBottom: 4, textAlign: 'center' }}>🙏</div> */}
          <div style={{ fontWeight: 600, color: '#222', fontSize: 15, textAlign: 'center', lineHeight: 1.4, marginBottom: 4 }}>
            ขอบคุณสำหรับคำถามของคุณ 🙏
          </div>
          <div style={{ color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 1.4 }}>
            Thank you for your feedback 🙏
          </div>
        </div>
        {timestamp && <p style={styles.timestamp}>{formatTime(timestamp)}</p>}
      </div>
    );
  }
  // Default system message
  return (
    <div style={styles.systemMessageContainer}>
      <p style={styles.systemMessage}>{text}</p>
      {timestamp && <p style={styles.timestamp}>{formatTime(timestamp)}</p>}
    </div>
  );
});

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
  mcSystemMessageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '18px 0 12px 0',
    width: '100%',
  },
  mcSystemMessageBubble: {
    background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
    borderRadius: 18,
    boxShadow: '0 4px 24px 0 rgba(59, 130, 246, 0.10)',
    padding: '18px 28px 14px 28px',
    maxWidth: 340,
    minWidth: 220,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mcSystemMessageContainerLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    margin: '18px 0 12px 0',
    width: '100%',
  },
  mcSystemMessageBubbleNeutral: {
    background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: 16,
    boxShadow: '0 2px 12px 0 rgba(100, 116, 139, 0.10)',
    padding: '16px 22px 12px 22px',
    marginLeft: 0,
    marginRight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #e5e7eb',
    maxWidth: 320,
    minWidth: 180,
  },
};

export default SystemMessage;
