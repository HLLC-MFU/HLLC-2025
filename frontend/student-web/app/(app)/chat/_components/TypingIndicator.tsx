import React, { useState, useEffect } from 'react';

interface TypingUser {
  id: string;
  name?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  const [dot1, setDot1] = useState(0);
  const [dot2, setDot2] = useState(0);
  const [dot3, setDot3] = useState(0);

  useEffect(() => {
    const animate = () => {
      setDot1(1);
      setTimeout(() => setDot1(0), 400);
      setTimeout(() => {
        setDot2(1);
        setTimeout(() => setDot2(0), 400);
      }, 200);
      setTimeout(() => {
        setDot3(1);
        setTimeout(() => setDot3(0), 400);
      }, 400);
      setTimeout(animate, 1200); // Repeats the animation
    };
    animate();
  }, []);

  return (
    <div style={styles.typingContainer}>
      <div style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, index) => (
          <div
            key={index}
            style={{
              ...styles.typingDot,
              transform: `translateY(${dot ? -4 : 0}px)`,
            }}
          />
        ))}
      </div>
      <span style={styles.typingText}>
        {typingUsers.length > 1
          ? `${typingUsers.length} คนกำลังพิมพ์...`
          : `${typingUsers[0]?.name || typingUsers[0]?.id || 'บางคน'} กำลังพิมพ์...`}
      </span>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  typingContainer: {
    display: 'flex',
    flexDirection: 'row' as React.CSSProperties['flexDirection'],
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
  },
  typingBubble: {
    display: 'flex',
    flexDirection: 'row' as React.CSSProperties['flexDirection'],
    backgroundColor: '#333',
    borderRadius: '10px',
    padding: '6px 8px',
    marginRight: '8px',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#999',
    margin: '0 2px',
    transition: 'transform 0.4s ease',
  },
  typingText: {
    color: '#999',
    fontSize: '12px',
  },
};

export default TypingIndicator;
