import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
  ViewStyle,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PinchGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
const mapsImage = require('@/assets/images/maps.png');

const screen = Dimensions.get('window');

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(value, max));
}

interface InteractiveMapProps {
  onImageLoad?: (imageSize: { width: number; height: number }) => void;
  children?: React.ReactNode;
}

export default function InteractiveMap({ onImageLoad, children }: InteractiveMapProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [minScale, setMinScale] = useState(1);

  useEffect(() => {
    Image.getSize(
      Image.resolveAssetSource(mapsImage).uri,
      (w, h) => {
        setImageSize({ width: w, height: h });
        const scaleW = screen.width / w;
        const scaleH = screen.height / h;
        const min = Math.max(scaleW, scaleH);
        setMinScale(min);
        scale.value = min;
        onImageLoad?.({ width: w, height: h });
      },
      err => {
        setImageSize({ width: screen.width, height: screen.height });
      },
    );
  }, []);

  const pinchHandler = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startScale: number }
  >({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = clamp(ctx.startScale * event.scale, minScale, 3);
    },
  });

  const panHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      const scaledWidth = imageSize.width * scale.value;
      const scaledHeight = imageSize.height * scale.value;

      const boundX = (scaledWidth - screen.width) / 2;
      const boundY = (scaledHeight - screen.height) / 2;

      translateX.value = clamp(
        ctx.startX + event.translationX,
        -boundX,
        boundX,
      );
      translateY.value = clamp(
        ctx.startY + event.translationY,
        -boundY,
        boundY,
      );
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    width: imageSize.width,
    height: imageSize.height,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!imageSize.width) return null;

  return (
    <PanGestureHandler onGestureEvent={panHandler}>
      <Animated.View style={StyleSheet.absoluteFill}>
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={[animatedStyle, styles.imageWrapper]}>
            {/* 🗺️ แผนที่ */}
            <Image
              source={mapsImage}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />

            {/* Render children (markers) */}
            {children}

            {/* 🌫️ เงาด้านบน */}
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'transparent']}
              style={styles.topShadow}
            />

            {/* 🌫️ เงาด้านล่าง */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.bottomShadow}
            />
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
    alignSelf: 'center',
  },
  topShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 10,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 10,
  },
}); 