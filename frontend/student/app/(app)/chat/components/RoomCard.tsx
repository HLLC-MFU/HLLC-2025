import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Activity,
  Clock,
  Heart,
  MessageCircle,
  Zap,
  Crown,
  Shield
} from 'lucide-react-native';
import { ChatRoom } from '../types/chatTypes';

interface EnhancedRoomCardProps {
  room: ChatRoom;
  width: number;
  language: string;
  onPress: () => void;
  onJoin?: () => void;
  index: number;
  showTrend?: boolean;
}

const EnhancedRoomCard = ({ 
  room, 
  width, 
  language, 
  onPress, 
  onJoin,
  index, 
  showTrend = false 
}: EnhancedRoomCardProps) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    console.log("Enhanced RoomCard received room:", JSON.stringify(room, null, 2));
    
    const delay = index * 120;
    
    // Entry animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        delay: delay + 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: delay + 50,
        useNativeDriver: true,
      })
    ]).start();

    // Continuous pulse for active rooms
    if (room.activity_score > 70) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start();
    }

    // Shimmer effect for featured rooms
    if (room.featured) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [index, room.activity_score, room.featured]);

  // Enhanced color generation based on room properties
  const roomTheme = useMemo(() => {
    const baseHue = (room.id?.charCodeAt(0) || 0) * 137 % 360;
    const isActive = room.activity_score > 60;
    const isPopular = (room.members?.length || 0) > 8;
    const isFeatured = room.featured;

    if (isFeatured) {
      return {
        primary: ['#a5b4fc', '#f0f4ff'], // ฟ้า-ขาว
        secondary: ['#c7d2fe', '#e0e7ff'],
        accent: '#6366f1',
        textShadow: 'rgba(99,102,241,0.15)'
      };
    } else if (isActive && isPopular) {
      return {
        primary: ['#a5b4fc', '#f0f4ff'],
        secondary: ['#c7d2fe', '#e0e7ff'],
        accent: '#6366f1',
        textShadow: 'rgba(99,102,241,0.12)'
      };
    } else if (isActive) {
      return {
        primary: ['#dbeafe', '#f0f4ff'],
        secondary: ['#c7d2fe', '#e0e7ff'],
        accent: '#60a5fa',
        textShadow: 'rgba(96,165,250,0.10)'
      };
    } else {
      return {
        primary: ['#f0f4ff', '#e0e7ff'],
        secondary: ['#e0e7ff', '#f0f4ff'],
        accent: '#a5b4fc',
        textShadow: 'rgba(165,180,252,0.10)'
      };
    }
  }, [room.id, room.activity_score, room.members, room.featured]);

  // Activity level indicator
  const getActivityLevel = () => {
    const score = room.activity_score || 0;
    if (score > 80) return { level: 'high', color: '#4CAF50', text: language === 'th' ? 'ร้อนแรง' : 'Hot' };
    if (score > 50) return { level: 'medium', color: '#FF9800', text: language === 'th' ? 'ปานกลาง' : 'Active' };
    return { level: 'low', color: '#757575', text: language === 'th' ? 'เงียบ' : 'Quiet' };
  };

  const activityLevel = getActivityLevel();
  const memberCount = room.members?.length || 0;
  const capacity = room.capacity || 10;
  const fillPercentage = (memberCount / capacity) * 100;

  // Time since last activity
  const getLastActiveTime = () => {
    if (!room.last_active) return '';
    
    const now = new Date();
    const lastActive = new Date(room.last_active);
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) return language === 'th' ? 'เพิ่งใช้งาน' : 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}${language === 'th' ? ' นาทีที่แล้ว' : 'm ago'}`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}${language === 'th' ? ' ชั่วโมงที่แล้ว' : 'h ago'}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}${language === 'th' ? ' วันที่แล้ว' : 'd ago'}`;
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100]
  });

  return (
    <Animated.View style={[
      styles.cardContainer,
      { 
        width: (width - 48) / 2,
        transform: [
          { scale: Animated.multiply(scaleAnim, pulseAnim) },
          { translateY: slideAnim }
        ], 
        opacity: opacityAnim 
      }
    ]}>
      <TouchableOpacity 
        style={styles.roomCard} 
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Main gradient background */}
        <LinearGradient
          colors={roomTheme.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roomCardGradient}
        />

        {/* Shimmer effect for featured rooms */}
        {room.featured && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }]
              }
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        )}

        {/* Top badges */}
        <View style={styles.badgesContainer}>
          {room.featured && (
            <View style={[styles.badge, styles.featuredBadge]}>
              <Crown size={10} color="#fff" />
              <Text style={styles.badgeText}>
                {language === 'th' ? 'แนะนำ' : 'Featured'}
              </Text>
            </View>
          )}
          
          {showTrend && room.popularity_trend === 'up' && (
            <View style={[styles.badge, styles.trendBadge]}>
              <TrendingUp size={10} color="#fff" />
              <Text style={styles.badgeText}>+{room.member_growth || 0}</Text>
            </View>
          )}
        </View>

        <View style={styles.roomCardContent}>
          {/* Avatar section */}
          <View style={styles.roomCardHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={roomTheme.secondary}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.roomAvatarText, { textShadowColor: roomTheme.textShadow }]}>
                  {(room.name?.th?.charAt(0) || room.name?.en?.charAt(0) || '?').toUpperCase()}
                </Text>
              </LinearGradient>
              
              {/* Activity pulse ring */}
              {room.activity_score > 70 && (
                <Animated.View style={[
                  styles.activityRing,
                  { 
                    borderColor: activityLevel.color,
                    transform: [{ scale: pulseAnim }]
                  }
                ]} />
              )}
            </View>
          </View>
          
          {/* Room info */}
          <View style={styles.roomInfo}>
            <Text style={[styles.roomCardName, { textShadowColor: roomTheme.textShadow }]} numberOfLines={1} ellipsizeMode="tail">
              {language === 'th' ? room.name?.th || 'ไม่มีชื่อ' : room.name?.en || 'Unnamed'}
            </Text>
            {/* Category/Tag */}
            {room.category && (
              <View style={styles.categoryTagContainer}>
                <Text style={styles.categoryTagText} numberOfLines={1} ellipsizeMode="tail">{room.category}</Text>
              </View>
            )}
            
            {/* Member stats with progress bar */}
            <View style={styles.memberStatsContainer}>
              <View style={styles.memberStats}>
                <Users size={12} color="#fff" />
                <Text style={styles.memberCount}>
                  {memberCount}/{capacity}
                </Text>
              </View>
              <View style={styles.memberProgressBar}>
                <View 
                  style={[
                    styles.memberProgress, 
                    { 
                      width: `${fillPercentage}%`,
                      backgroundColor: fillPercentage > 80 ? '#FF5722' : '#4CAF50'
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Activity and timing */}
            <View style={styles.statusRow}>
              <View style={styles.activityIndicator}>
                <Activity size={10} color={activityLevel.color} />
                <Text style={styles.activityText}>{activityLevel.text}</Text>
              </View>
              
              <View style={styles.timeIndicator}>
                <Clock size={10} color="rgba(255,255,255,0.7)" />
                <Text style={styles.timeText}>{getLastActiveTime()}</Text>
              </View>
            </View>

            {/* Join button for non-members */}
            {!room.is_member && onJoin && (
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onJoin();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.joinButtonGradient}
                >
                  <Text style={styles.joinButtonText}>
                    {language === 'th' ? 'เข้าร่วม' : 'Join'}
                  </Text>
                  <Zap size={12} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom accent line */}
        <View style={[styles.accentLine, { backgroundColor: roomTheme.accent }]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  roomCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    height: 210,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  roomCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: 0,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  featuredBadge: {
    backgroundColor: '#6366f1',
  },
  trendBadge: {
    backgroundColor: '#60a5fa',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  roomCardContent: {
    padding: 14,
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  roomCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activityRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  roomAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roomInfo: {
    gap: 8,
  },
  roomCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22223b',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
    maxWidth: 120,
    alignSelf: 'center',
  },
  memberStatsContainer: {
    gap: 4,
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  memberProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  memberProgress: {
    height: '100%',
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
  },
  joinButton: {
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  categoryTagContainer: {
    alignSelf: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
    marginBottom: 2,
    maxWidth: 100,
  },
  categoryTagText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    maxWidth: 90,
  },
});

export default EnhancedRoomCard;