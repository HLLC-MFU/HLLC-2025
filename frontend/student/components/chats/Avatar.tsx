import { AVATAR_COLORS } from '@/constants/chats/chatConstants';
import { AvatarProps } from '@/types/chatTypes';
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Avatar = memo(({ name, online, size = 40 }: AvatarProps) => {
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  return (
    <View style={{ position: 'relative', marginRight: 8 }}>
      <View style={[
        styles.avatar,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: getAvatarColor(name)
        }
      ]}>
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
      </View>
      {online !== undefined && (
        <View style={[
          styles.statusIndicator,
          { backgroundColor: online ? '#4CAF50' : '#bbb' }
        ]} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#121212',
  },
});

export default Avatar; 