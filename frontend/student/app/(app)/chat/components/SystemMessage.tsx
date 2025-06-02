import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SystemMessageProps } from '../types/chatTypes';
import { formatTime } from '../utils/timeUtils';

const SystemMessage = memo(({ text, timestamp }: SystemMessageProps) => (
  <View style={styles.systemMessageContainer}>
    <Text style={styles.systemMessage}>{text}</Text>
    {timestamp && <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>}
  </View>
));

const styles = StyleSheet.create({
  systemMessageContainer: { 
    alignItems: 'center', 
    marginVertical: 12, 
    opacity: 0.8,
  },
  systemMessage: { 
    color: '#bbb', 
    fontSize: 12, 
    backgroundColor: 'rgba(70, 70, 70, 0.5)', 
    paddingVertical: 6,
    paddingHorizontal: 12, 
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 4,
  },
});

export default SystemMessage; 