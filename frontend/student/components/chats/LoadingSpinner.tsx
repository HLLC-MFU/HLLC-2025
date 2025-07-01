import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner = ({ text }: LoadingSpinnerProps) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: 0.7,
            transform: [{ scale: pulseValue }],
          },
        ]}
      />
      <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: spin }] }]}>  
        <LinearGradient
          colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        />
      </Animated.View>
      <View style={styles.loadingInnerCircle}>
        <MaterialCommunityIcons name="account-group" size={32} color="#fff" style={{ opacity: 0.85 }} />
      </View>
      <Text style={styles.emoji}>💬</Text>
      {text && <Text style={styles.loadingText}>{text || 'กำลังโหลดคอมมูนิตี้ดีๆ ให้คุณ...'}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 120,
  },
  glow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#91EAE4',
    shadowColor: '#91EAE4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    zIndex: 0,
  },
  loadingContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    position: 'absolute',
    zIndex: 1,
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  loadingInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#222C36',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    position: 'absolute',
  },
  emoji: {
    fontSize: 28,
    marginTop: 80,
    marginBottom: 4,
    textAlign: 'center',
    opacity: 0.85,
  },
  loadingText: {
    color: '#6EC6FF',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default LoadingSpinner; 