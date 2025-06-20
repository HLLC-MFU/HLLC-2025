import React from 'react';
import { View, StyleSheet, Platform, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  width?: number;
  height?: number;
  duration?: number;
  scaleFactor?: number;
  shadow?: boolean;
}

export const FlipCard = ({
  front,
  back,
  width = 300,
  height = 400,
  duration = 800,
  scaleFactor = 0.92,
  shadow = true,
}: FlipCardProps) => {

  const progress = useSharedValue(0);

  const flip = () => {
    progress.value = withTiming(progress.value === 0 ? 1 : 0, { duration });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [0, 90]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [1, 0, 0], Extrapolate.CLAMP);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, scaleFactor, 1]);

    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [-90, 0]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0, 1], Extrapolate.CLAMP);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, scaleFactor, 1]);

    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={flip}>
      <View style={[{ width, height }, shadow && styles.shadow]}>
        <Animated.View style={[StyleSheet.absoluteFill, frontAnimatedStyle]}>
          {front}
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, backAnimatedStyle]}>
          {back}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
      android: {
        elevation: 12,
      }
    }),
  },
});
