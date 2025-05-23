import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { ChatRoom } from '../types/chatTypes';

interface RoomCardProps {
  room: ChatRoom;
  width: number;
  language: string;
  onPress: () => void;
  index: number;
}

const RoomCard = ({ room, width, language, onPress, index }: RoomCardProps) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    console.log("RoomCard received room:", JSON.stringify(room, null, 2));
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const hue = useMemo(() => (room.id?.charCodeAt(0) || 0) * 137 % 360, [room.id]);

  return (
    <Animated.View style={[
      { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
    ]}>
      <TouchableOpacity 
        style={[styles.roomCard, { width: (width - 48) / 2 }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[`hsla(${hue}, 80%, 40%, 0.8)`, `hsla(${hue + 60}, 70%, 30%, 0.9)`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roomCardGradient}
        />

        <View style={styles.roomCardContent}>
          <View style={styles.roomCardHeader}>
            <View style={[styles.roomCardAvatar]}>
              <LinearGradient
                colors={[`hsla(${hue + 30}, 90%, 55%, 1)`, `hsla(${hue - 30}, 90%, 45%, 1)`]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.roomAvatarText}>
                  {(room.name?.th?.charAt(0) || '?').toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.roomInfo}>
            <Text style={styles.roomCardName} numberOfLines={1} ellipsizeMode="tail">
              {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
            </Text>
            <View style={styles.roomStatsCard}>
              <Users size={14} color="#fff" />
              <Text style={styles.roomMembersCard}>
                {room.members?.length || 0} / {room.capacity || 0}
              </Text>
            </View>
            
            <View style={styles.activityIndicator}>
              <View style={[styles.pulsingDot, {
                backgroundColor: (room.members?.length || 0) > 3 ? '#4CAF50' : '#FFA726'
              }]} />
              <Text style={styles.activityText}>
                {(room.members?.length || 0) > 3 ? 
                  (language === 'th' ? 'กำลังใช้งาน' : 'Active') : 
                  (language === 'th' ? 'เงียบสงบ' : 'Quiet')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  roomCard: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    height: 170,
  },
  roomCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roomCardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  roomCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  roomAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  roomInfo: {
    gap: 8,
  },
  roomCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  roomStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roomMembersCard: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    marginTop: 4,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  activityText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default RoomCard; 