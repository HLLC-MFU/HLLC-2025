import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomTabBarProps {
  activeTab: 'my' | 'discover';
  onTabChange: (tab: 'my' | 'discover') => void;
  language: string;
  tabBarOpacity: Animated.AnimatedInterpolation<string | number>;
  tabBarAnimation: Animated.Value;
  tabIndicatorPosition: Animated.Value;
}

const { width } = Dimensions.get('window');

const CustomTabBar = ({
  activeTab,
  onTabChange,
  language,
  tabBarOpacity,
  tabBarAnimation,
  tabIndicatorPosition,
}: CustomTabBarProps) => {
  return (
    <Animated.View 
      style={[
        styles.customTabBar,
        { 
          opacity: tabBarOpacity,
          transform: [{ scale: tabBarAnimation }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => onTabChange('my')}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'my' && styles.activeTabText
        ]}>
          {language === 'th' ? 'ห้องของฉัน' : 'My Rooms'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => onTabChange('discover')}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'discover' && styles.activeTabText
        ]}>
          {language === 'th' ? 'ค้นหาห้อง' : 'Discover'}
        </Text>
      </TouchableOpacity>
      
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{
              translateX: tabIndicatorPosition.interpolate({
                inputRange: [0, 1],
                outputRange: [0, width / 2 - 20]
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.indicatorGradient}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  customTabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 12,
    height: 48,
    backgroundColor: 'rgba(30,30,30,0.8)',
    borderRadius: 24,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    zIndex: 2,
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: 40,
    borderRadius: 20,
    zIndex: 1,
    top: 4,
    left: 4,
  },
  indicatorGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

export default CustomTabBar; 