import React, { memo } from 'react';
import { formatTime } from '@/utils/chats/timeUtils';

interface SystemMessageProps {
  text: string;
  timestamp?: string;
  userRoleName?: string; // <-- add this prop
}

const SystemMessage = memo(({ text, timestamp, userRoleName }: SystemMessageProps) => {
  // Custom rendering for MC room feedback
  if (text === 'ขอบคุณสำหรับคำถามของคุณ /n Thank you for your feedback') {
    // Only show for Fresher
    if (userRoleName?.toLowerCase() !== 'fresher') return null;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', margin: '18px 0 12px 0', width: '100%' }}>
        {/* System Avatar */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 18,
          color: '#fff',
          marginRight: 12,
          boxShadow: '0 2px 8px 0 rgba(59, 130, 246, 0.10)',
          border: '2px solid #e5e7eb',
          flexShrink: 0,
        }} title="System">S</div>
        <div style={{ flex: 1 }}>
          {/* System Name and Username */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={{
              fontWeight: 500,
              color: '#64748b',
              fontSize: 13,
              padding: '2px 8px',
              borderRadius: 8,
              letterSpacing: 0.1,
              marginLeft: 2
            }}>@system</span>
          </div>
          {/* System Message */}
          <div style={styles.mcSystemMessageBubbleNeutral}>
            <div style={{ fontWeight: 600, color: '#222', fontSize: 15, lineHeight: 1.5, marginBottom: 4, textAlign: 'left' }}>
              ขอบคุณสำหรับคำถามของคุณ 🙏
            </div>
            <div style={{ color: '#555', fontSize: 13, lineHeight: 1.4, textAlign: 'left' }}>
              Thank you for your feedback 🙏
            </div>
          </div>
          {timestamp && <p style={styles.timestamp}>{formatTime(timestamp)}</p>}
        </div>
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
    marginRight: 0,
    display: 'inline-block',
    border: '1px solid #e5e7eb',
    minWidth: 0,
    maxWidth: '80%',
    wordBreak: 'break-word',
  },
};

export default SystemMessage;
