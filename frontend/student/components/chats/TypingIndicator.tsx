import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TypingIndicatorProps {
  typingUsers: Array<{ id: string; name?: string }>;
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animate = () => {
      const animations = [
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0, duration: 400, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 400, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 400, useNativeDriver: true })
        ])
      ];

      Animated.parallel(animations).start(() => animate());
    };

    animate();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.typingDot,
              {
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
      </View>
      <Text style={styles.typingText}>
        {typingUsers.length > 1 
          ? `${typingUsers.length} คนกำลังพิมพ์...` 
          : `${typingUsers[0]?.name || typingUsers[0]?.id || 'บางคน'} กำลังพิมพ์...`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  typingText: {
    color: '#999',
    fontSize: 12,
  },
});

export default TypingIndicator; 