import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MessageCircle, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ChatTabBarProps {
  language: string;
  activeTab: 'my' | 'discover';
  onTabChange: (tab: 'my' | 'discover') => void;
  tabBarAnimation: Animated.Value;
}

export const ChatTabBar = ({
  language,
  activeTab,
  onTabChange,
  tabBarAnimation,
}:ChatTabBarProps) => {
  return (
    <Animated.View style={[styles.tabBarWrapper, { transform: [{ scale: tabBarAnimation }] }]}> 
      <BlurView
        intensity={30}
        tint="light"
        style={styles.tabBarBlur}
      >
        <View style={styles.tabBarContainer}>
          {[
            { key: 'discover', label: language === 'th' ? 'ค้นพบ' : 'Discover', icon: Sparkles },
            { key: 'my', label: language === 'th' ? 'ของฉัน' : 'My Rooms', icon: MessageCircle }
          ].map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, activeTab === key && styles.tabBtnActive]}
              onPress={() => onTabChange(key as 'my' | 'discover')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={activeTab === key ? ['#6366f1', '#8b5cf6'] : ['transparent', 'transparent']}
                style={styles.tabBtnGradient}
              >
                <Icon size={18} color={activeTab === key ? '#fff' : '#6366f1'} />
                <Text style={[styles.tabBtnText, activeTab === key && styles.tabBtnTextActive]}>{label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  tabBarBlur: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tabBarContainer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
    borderRadius: 18,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabBtnActive: {
    shadowColor: '#6366f1',
    shadowOpacity: 0.12,
    elevation: 2,
  },
  tabBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    gap: 8,
    borderRadius: 14,
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
}); 