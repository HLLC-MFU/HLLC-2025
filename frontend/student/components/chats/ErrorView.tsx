import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { X } from 'lucide-react-native';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

const ErrorView = ({ message, onRetry }: ErrorViewProps) => (
  <View style={[styles.container, styles.centerContent]}>
    <StatusBar barStyle="light-content" />
    <X color="#ff4444" size={48} />
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity 
      style={styles.retryButton} 
      onPress={onRetry}
      activeOpacity={0.7}
    >
      <Text style={styles.retryText}>ลองใหม่</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorText: { 
    color: '#ff4444', 
    fontSize: 16, 
    textAlign: 'center', 
    margin: 16 
  },
  retryButton: { 
    backgroundColor: '#0A84FF', 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  retryText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorView; 