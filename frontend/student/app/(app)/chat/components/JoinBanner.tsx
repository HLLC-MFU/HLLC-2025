import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';

interface JoinBannerProps {
  onJoin: () => void;
  joining: boolean;
  roomCapacity: number;
  connectedCount: number;
}

const JoinBanner = ({ onJoin, joining, roomCapacity, connectedCount }: JoinBannerProps) => (
  <BlurView intensity={80} tint="dark" style={styles.joinContainer}>
    <Text style={styles.joinMessage}>คุณยังไม่ได้เป็นสมาชิกห้องนี้ เข้าร่วมเพื่อเริ่มแชท</Text>
    <Text style={styles.capacityText}>
      {connectedCount}/{roomCapacity} คนเข้าร่วม
    </Text>
    <TouchableOpacity 
      style={styles.joinButton} 
      onPress={onJoin} 
      disabled={joining}
      activeOpacity={0.8}
    >
      {joining ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.joinButtonText}>เข้าร่วมห้องแชท</Text>
      )}
    </TouchableOpacity>
  </BlurView>
);

const styles = StyleSheet.create({
  joinContainer: { 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    padding: 20, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  joinMessage: { 
    color: '#fff', 
    marginBottom: 8,
    fontSize: 15,
    textAlign: 'center',
  },
  capacityText: {
    color: '#999',
    marginBottom: 16,
    fontSize: 14,
  },
  joinButton: { 
    backgroundColor: '#0A84FF', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    minWidth: 150,
    alignItems: 'center',
  },
  joinButtonText: { 
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default JoinBanner; 