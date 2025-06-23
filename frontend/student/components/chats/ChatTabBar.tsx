import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { MessageCircle, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface ChatTabBarProps {
  language: string;
  activeTab: 'my' | 'discover';
  onTabChange: (tab: 'my' | 'discover') => void;
  tabBarAnimation: any; //
}

const tabs = [
  { key: 'discover', label: (lang: string) => lang === 'th' ? 'ค้นพบ' : 'Discover', icon: Sparkles },
  { key: 'my', label: (lang: string) => lang === 'th' ? 'ของฉัน' : 'My Rooms', icon: MessageCircle },
];

export const ChatTabBar = ({ language, activeTab, onTabChange }: ChatTabBarProps) => {
  const { width } = useWindowDimensions();
  const tabBarPadding = 8;
  const tabWidth = (width - 42 - tabBarPadding * 2) / tabs.length;
  const offsetX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const currentIndex = tabs.findIndex(tab => tab.key === activeTab);
    if (currentIndex !== -1) {
      offsetX.value = withSpring(currentIndex * tabWidth, { damping: 15 });
      scale.value = withSpring(1.12, { damping: 10 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 15 });
      }, 180);
    }
  }, [activeTab]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value + tabBarPadding },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.tabBarWrapper}>
      <BlurView intensity={30} tint="light" style={styles.tabBarBlur}>
        <View style={styles.tabBarContainer}>
          {/* Focus pill */}
          <Animated.View
            style={[
              styles.focusPill,
              { width: tabWidth } as ViewStyle,
              animatedPillStyle,
            ]}
          >
            <BlurView tint="light" intensity={60} style={styles.blurInsidePill} />
          </Animated.View>
          {tabs.map(({ key, label, icon: Icon }, idx) => {
            const isActive = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                style={styles.tabBtn}
                onPress={() => onTabChange(key as 'my' | 'discover')}
                activeOpacity={0.85}
              >
                <Icon size={18} color={isActive ? '#fff' : '#ffffff70'} />
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{label(language)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
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
    backgroundColor: 'transparent',
    borderRadius: 18,
    padding: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusPill: {
    position: 'absolute',
    left: 0,
    top: 4,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 0,
    shadowColor: '#fff',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  blurInsidePill: {
    flex: 1,
    backgroundColor: 'rgba(214, 214, 224, 0.18)',
  },
  tabBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff70',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
});

export default ChatTabBar; 