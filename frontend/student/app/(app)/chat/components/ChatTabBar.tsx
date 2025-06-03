import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MessageCircle, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatTabBarProps {
  language: string;
  activeTab: 'my' | 'discover';
  onTabChange: (tab: 'my' | 'discover') => void;
  tabBarAnimation: Animated.Value;
}

export const ChatTabBar: React.FC<ChatTabBarProps> = ({
  language,
  activeTab,
  onTabChange,
  tabBarAnimation,
}) => {
  return (
    <Animated.View style={[styles.enhancedTabBar, { transform: [{ scale: tabBarAnimation }] }]}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.tabBarGradient}
      >
        <View style={styles.tabBarContainer}>
          {[
            { key: 'discover', label: language === 'th' ? 'ค้นพบ' : 'Discover', icon: Sparkles },
            { key: 'my', label: language === 'th' ? 'ของฉัน' : 'My Rooms', icon: MessageCircle }
          ].map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabButton,
                activeTab === key && styles.tabButtonActive
              ]}
              onPress={() => onTabChange(key as 'my' | 'discover')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={activeTab === key ? ['#6366f1', '#8b5cf6'] : ['transparent', 'transparent']}
                style={styles.tabButtonGradient}
              >
                <Icon size={18} color={activeTab === key ? '#fff' : '#64748b'} />
                <Text style={[
                  styles.tabButtonText,
                  activeTab === key && styles.tabButtonTextActive
                ]}>
                  {label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  enhancedTabBar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tabBarGradient: {
    padding: 4,
  },
  tabBarContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButtonActive: {},
  tabButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
}); 