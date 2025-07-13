import React, { useEffect, useState, useMemo } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  withDecay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PinchGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';

const mapsImage = require('@/assets/images/map.png');
const screen = Dimensions.get('window');

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(value, max));
}

type InteractiveMapProps = {
  onImageLoad?: (imageSize: { width: number; height: number }) => void;
  children?: React.ReactNode;
};

export default function InteractiveMap({
  onImageLoad,
  children,
}: InteractiveMapProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const panVelocityX = useSharedValue(0);
  const panVelocityY = useSharedValue(0);

  const [imageSize, setImageSize] = useState({ width: 6000, height: 2469 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Memoize initial scale calculation
  const initialScale = useMemo(() => {
    const scaleW = screen.width / imageSize.width;
    const scaleH = screen.height / imageSize.height;
    return Math.max(scaleW, scaleH);
  }, [imageSize.width, imageSize.height]);

  useEffect(() => {
    const resolvedSource = Image.resolveAssetSource(mapsImage);
    
    if (resolvedSource?.uri) {
      Image.getSize(
        resolvedSource.uri,
        (width, height) => {
          setImageSize({ width, height });
          
          const scaleW = screen.width / width;
          const scaleH = screen.height / height;
          const initialScale = Math.max(scaleW, scaleH);
          
          scale.value = withSpring(initialScale, {
            damping: 20,
            stiffness: 200,
          });
          
          setIsImageLoaded(true);
          onImageLoad?.({ width, height });
        },
        () => {
          scale.value = withSpring(initialScale, {
            damping: 20,
            stiffness: 200,
          });
          setIsImageLoaded(true);
        }
      );
    } else {
      scale.value = withSpring(initialScale, {
        damping: 20,
        stiffness: 200,
      });
      setIsImageLoaded(true);
    }
  }, [initialScale]);

  const pinchHandler = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    {
      startScale: number;
      startFocalX: number;
      startFocalY: number;
      startTranslateX: number;
      startTranslateY: number;
    }
  >({
    onStart: (event, ctx) => {
      ctx.startScale = scale.value;
      ctx.startTranslateX = translateX.value;
      ctx.startTranslateY = translateY.value;
      ctx.startFocalX = event.focalX;
      ctx.startFocalY = event.focalY;
    },
    onActive: (event, ctx) => {
      const scaleW = screen.width / imageSize.width;
      const scaleH = screen.height / imageSize.height;
      const minScale = Math.max(scaleW, scaleH);
      const maxScale = 1;
      const newScale = clamp(ctx.startScale * event.scale, minScale, maxScale);

      // focal point relative to image center and current translate
      const focalX = event.focalX - screen.width / 2 - ctx.startTranslateX;
      const focalY = event.focalY - screen.height / 2 - ctx.startTranslateY;

      translateX.value = ctx.startTranslateX + (1 - event.scale) * focalX;
      translateY.value = ctx.startTranslateY + (1 - event.scale) * focalY;
      scale.value = newScale;

      // Apply bounds
      const scaledWidth = imageSize.width * newScale;
      const scaledHeight = imageSize.height * newScale;
      const boundX = Math.max(0, (scaledWidth - screen.width) / 2);
      const boundY = Math.max(0, (scaledHeight - screen.height) / 2);

      translateX.value = clamp(translateX.value, -boundX, boundX);
      translateY.value = clamp(translateY.value, -boundY, boundY);
    },
    onEnd: () => {
      // Smooth spring back to bounds if needed
      const scaledWidth = imageSize.width * scale.value;
      const scaledHeight = imageSize.height * scale.value;
      const boundX = Math.max(0, (scaledWidth - screen.width) / 2);
      const boundY = Math.max(0, (scaledHeight - screen.height) / 2);
      
      if (translateX.value < -boundX || translateX.value > boundX) {
        translateX.value = withSpring(clamp(translateX.value, -boundX, boundX), {
          damping: 15,
          stiffness: 200,
        });
      }
      
      if (translateY.value < -boundY || translateY.value > boundY) {
        translateY.value = withSpring(clamp(translateY.value, -boundY, boundY), {
          damping: 15,
          stiffness: 200,
        });
      }
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

      const boundX = Math.max(0, (scaledWidth - screen.width) / 2);
      const boundY = Math.max(0, (scaledHeight - screen.height) / 2);

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
      
      // Store velocity for decay animation
      panVelocityX.value = event.velocityX;
      panVelocityY.value = event.velocityY;
    },
    onEnd: () => {
      // Apply decay animation for smooth momentum scrolling
      const scaledWidth = imageSize.width * scale.value;
      const scaledHeight = imageSize.height * scale.value;
      const boundX = Math.max(0, (scaledWidth - screen.width) / 2);
      const boundY = Math.max(0, (scaledHeight - screen.height) / 2);
      
      translateX.value = withDecay({
        velocity: panVelocityX.value * 0.8, // Dampen velocity
        clamp: [-boundX, boundX],
        deceleration: 0.998,
      });
      
      translateY.value = withDecay({
        velocity: panVelocityY.value * 0.8,
        clamp: [-boundY, boundY],
        deceleration: 0.998,
      });
    },
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    // Optimize rendering by limiting updates when values are very close
    const threshold = 0.001;
    const roundedScale = Math.round(scale.value / threshold) * threshold;
    const roundedX = Math.round(translateX.value / threshold) * threshold;
    const roundedY = Math.round(translateY.value / threshold) * threshold;
    
    return {
      width: imageSize.width,
      height: imageSize.height,
      transform: [
        { translateX: roundedX },
        { translateY: roundedY },
        { scale: roundedScale },
      ],
    };
  });

  // Add a handler to log tap position
  const handleMapPress = (event: any) => {
    // Get tap position relative to the image
    const { locationX, locationY } = event.nativeEvent;
    console.log('[MAP TAP]', { x: Math.round(locationX), y: Math.round(locationY) });
  };

  return (
    <View style={styles.container}>
      {!isImageLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#aaa" />
        </View>
      )}
      <PanGestureHandler 
        onGestureEvent={panHandler}
        minPointers={1}
        maxPointers={1}
        avgTouches={true}
      >
        <Animated.View style={styles.gestureContainer}>
          <PinchGestureHandler 
            onGestureEvent={pinchHandler}
            simultaneousHandlers={[]}
          >
            <Animated.View style={styles.gestureContainer}>
              <TouchableWithoutFeedback onPress={handleMapPress}>
                <View style={styles.imageContainer}>
                  <Animated.View style={[{ width: imageSize.width, height: imageSize.height }, imageAnimatedStyle]}>
                    <Animated.Image
                      source={mapsImage}
                      style={[styles.image, !isImageLoaded && { opacity: 0 }]}
                      resizeMode="contain"
                      onLoad={() => setIsImageLoaded(true)}
                      fadeDuration={300}
                      progressiveRenderingEnabled={true}
                    />
                    <View style={styles.overlay} pointerEvents="none" />
                    {/* Render children (markers) on top of the image, sharing the same transform */}
                    {isImageLoaded && children}
                  </Animated.View>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gestureContainer: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    // Performance optimizations
    opacity: 1,
  },
  childrenContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'box-none', // Allow touches to pass through to children
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.35, 
    zIndex: 2,
  },
});