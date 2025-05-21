import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner = ({ text }: LoadingSpinnerProps) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true
      })
    ).start();
  }, []);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingRing, { transform: [{ rotate: spin }] }]}>
        <LinearGradient
          colors={['#4CAF50', '#8BC34A', '#4CAF50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        />
      </Animated.View>
      <View style={styles.loadingInnerCircle} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
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
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#AAA',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingSpinner; 