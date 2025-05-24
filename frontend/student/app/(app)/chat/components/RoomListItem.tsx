import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Clock } from 'lucide-react-native';
import { ChatRoom } from '../types/chatTypes';

interface RoomListItemProps {
  room: ChatRoom;
  language: string;
  onPress: () => void;
  index: number;
}

const RoomListItem = ({ room, language, onPress, index }: RoomListItemProps) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const hue = useMemo(() => (room.id?.charCodeAt(0) || 0) * 137 % 360, [room.id]);
  
  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getRandomTime = () => {
    const hours = Math.floor(Math.random() * 12) + 1;
    return hours <= 3 ? 
      (language === 'th' ? `${hours} ชั่วโมงที่แล้ว` : `${hours}h ago`) : 
      (language === 'th' ? 'เมื่อวาน' : 'Yesterday');
  };

  const lastActive = useMemo(() => getRandomTime(), [room.id]);

  return (
    <Animated.View style={{
      opacity: opacityAnim,
      transform: [{ translateX: slideAnim }]
    }}>
      <TouchableOpacity 
        style={styles.roomListItem} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.roomAvatarContainer}>
          <LinearGradient
            colors={[`hsla(${hue + 30}, 90%, 55%, 1)`, `hsla(${hue - 30}, 90%, 45%, 1)`]}
            style={styles.roomAvatar}
          >
            <Text style={styles.roomAvatarText}>
              {(room.name?.th?.charAt(0) || '?').toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.roomJoinedBadge} />
        </View>
        
        <View style={styles.roomListInfo}>
          <Text style={styles.roomName}>
            {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
          </Text>
          
          <View style={styles.roomExtraInfo}>
            <View style={styles.roomStats}>
              <Users size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.roomMembers}>
                {room.members?.length || 0} / {room.capacity || 0}
              </Text>
            </View>
            
            <View style={styles.lastActiveContainer}>
              <Clock size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.lastActiveText}>{lastActive}</Text>
            </View>
          </View>
        </View>
        
        {Math.random() > 0.6 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{Math.floor(Math.random() * 9) + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  roomListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  roomAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  roomAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomListInfo: {
    flex: 1,
  },
  roomExtraInfo: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomMembers: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  lastActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastActiveText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  roomJoinedBadge: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#121212',
    bottom: 0,
    right: 0,
  },
  unreadBadge: {
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  roomAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default RoomListItem; 