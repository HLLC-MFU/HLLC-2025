import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { X } from 'lucide-react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

export const ImagePreviewModal = ({ visible, imageUrl, onClose }: ImagePreviewModalProps) => {
  const [internalVisible, setInternalVisible] = useState(visible);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Show modal immediately when visible=true
  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      translateY.value = 0;
      opacity.value = 1;
    } else {
      // Animate out, then hide modal
      opacity.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(setInternalVisible)(false);
        }
      });
      translateY.value = withTiming(height, { duration: 220 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Smooth close handler (for button and gesture)
  const handleSmoothClose = useCallback(() => {
    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(setInternalVisible)(false);
        runOnJS(onClose)();
      }
    });
    translateY.value = withTiming(height, { duration: 220 });
  }, [onClose, opacity, translateY]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = 1 - (event.translationY / height) * 0.5;
      }
    },
    onEnd: (event) => {
      if (event.translationY > SWIPE_THRESHOLD) {
        // Animate out, then call onClose
        opacity.value = withTiming(0, { duration: 220 }, (finished) => {
          if (finished) {
            runOnJS(setInternalVisible)(false);
            runOnJS(onClose)();
          }
        });
        translateY.value = withTiming(height, { duration: 220 });
      } else {
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      onRequestClose={handleSmoothClose}
    >
      <StatusBar hidden />
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleSmoothClose}
          activeOpacity={0.7}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={animatedStyle}>
            <Image
              key={imageUrl} // Force re-render when imageUrl changes
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onError={(error) => {
                console.error('Error loading preview image:', error.nativeEvent.error);
              }}
            />
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  image: {
    width: width,
    height: height,
  },
});

export default ImagePreviewModal; 