import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const useChatAnimations = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const tabBarAnimation = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animateFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const animateTabBar = () => {
    Animated.sequence([
      Animated.timing(tabBarAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabBarAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    scrollY,
    headerScale,
    tabBarAnimation,
    fabScale,
    shimmerAnim,
    pulseAnim,
    animateFab,
    animateTabBar,
  };
};

export default useChatAnimations; 