import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, Animated } from 'react-native';
import { Users, MessageCircle } from 'lucide-react-native';

interface ChatHeaderProps {
  language: string;
  roomsCount: number;
  joinedRoomsCount: number;
  headerScale: Animated.Value;
  pulseAnim: Animated.Value;
  headerOpacity: Animated.AnimatedInterpolation<string | number>;
}

export default function ChatHeader ({
  language,
  roomsCount,
  joinedRoomsCount,
  headerScale,
  pulseAnim,
  headerOpacity,
}: ChatHeaderProps) {
  return (
    <Animated.View style={[styles.enhancedHeader, { opacity: headerOpacity }]}>
      
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>
              {language === 'th' ? 'สวัสดี!' : 'Welcome!'}
            </Text>
            <Animated.Text style={[styles.headerTitle, { transform: [{ scale: headerScale }] }]}>
              {language === 'th' ? 'ชุมชนของเรา' : 'Our Community'}
            </Animated.Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Animated.View style={[styles.statItem, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.statIconContainer}>
              <Users size={16} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{roomsCount}</Text>
            <Text style={styles.statLabel}>
              {language === 'th' ? 'ห้อง' : 'Rooms'}
            </Text>
          </Animated.View>
          
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MessageCircle size={16} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{joinedRoomsCount}</Text>
            <Text style={styles.statLabel}>
              {language === 'th' ? 'เข้าร่วม' : 'Joined'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  enhancedHeader: {
    paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#ffffff70',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff70',
    fontWeight: '500',
  },
});

