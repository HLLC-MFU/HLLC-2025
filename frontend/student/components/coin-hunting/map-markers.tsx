import React, { useEffect } from 'react';
import { TouchableOpacity, ViewStyle, Image, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { apiRequest } from '@/utils/api';
import { Lang } from '@/types/lang';

export interface Marker {
  x: number;
  y: number;
  image: string;
  description: Lang;
  mapsUrl: string;
  _id: string;
  coinImage?: string;
}

interface MapMarkersProps {
  markers: Marker[];
  collectedIds: string[];
  loading: boolean;
  error: string | null;
  onMarkerPress: (marker: Marker) => void;
  imageSize: { width: number; height: number };
  containerSize: { width: number; height: number };
}

// Extracted MarkerItem component to allow hooks usage per marker
function MarkerItem({
  marker,
  isCollected,
  markerX,
  markerY,
  markerSize,
  onPress,
}: {
  marker: Marker;
  isCollected: boolean;
  markerX: number;
  markerY: number;
  markerSize: number;
  onPress: () => void;
}) {
  const glowAnimation = useSharedValue(0);

  useEffect(() => {
    if (isCollected) {
      glowAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0.3, { duration: 2000 }),
        ),
        -1,
        true,
      );
    } else {
      glowAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 }),
          withTiming(0.2, { duration: 3000 }),
        ),
        -1,
        true,
      );
    }
  }, [isCollected]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.1, 0.4]);
    return { opacity };
  });

  return (
    <TouchableOpacity
      key={marker._id}
      style={[
        {
          position: 'absolute',
          width: markerSize,
          height: markerSize,
          zIndex: 5,
          top: markerY - markerSize / 2,
          left: markerX - markerSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
        } as ViewStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* แสงด้านหลังหลัก */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: markerSize * (160 / 120),
            height: markerSize * (160 / 120),
            borderRadius: (markerSize * (160 / 120)) / 2,
            backgroundColor: isCollected
              ? 'rgba(255, 215, 0, 0.15)'
              : 'rgba(128, 128, 128, 0.1)',
            shadowColor: isCollected ? '#FFD700' : '#808080',
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.6,
            shadowRadius: 20,
            elevation: 8,
          },
          animatedGlowStyle,
        ]}
      />

      {/* แสงรอบที่สอง */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: markerSize * (130 / 120),
            height: markerSize * (130 / 120),
            borderRadius: (markerSize * (130 / 120)) / 2,
            backgroundColor: isCollected
              ? 'rgba(255, 215, 0, 0.25)'
              : 'rgba(128, 128, 128, 0.15)',
            shadowColor: isCollected ? '#FFD700' : '#808080',
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.7,
            shadowRadius: 15,
            elevation: 10,
          },
          animatedGlowStyle,
        ]}
      />

      {/* แสงรอบที่สาม */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: markerSize * (100 / 120),
            height: markerSize * (100 / 120),
            borderRadius: (markerSize * (100 / 120)) / 2,
            backgroundColor: isCollected
              ? 'rgba(255, 215, 0, 0.3)'
              : 'rgba(128, 128, 128, 0.2)',
            shadowColor: isCollected ? '#FFD700' : '#808080',
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.8,
            shadowRadius: 12,
            elevation: 12,
          },
          animatedGlowStyle,
        ]}
      />

      {/* เหรียญหรือเครื่องหมายคำถามและวงกลมขาวโปร่งแสง */}
      <View
        style={[
          {
            position: 'absolute',
            width: markerSize * (110 / 120),
            height: markerSize * (110 / 120),
            borderRadius: (markerSize * (110 / 120)) / 2,
            backgroundColor: !isCollected ? 'rgba(255,255,255,0.35)' : 'transparent',
            borderWidth: !isCollected ? 3 : 0,
            borderColor: !isCollected ? '#fff' : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 14,
          }
        ]}
      >
        { !isCollected ? (
          <View
            style={{
              width: markerSize * (80 / 120),
              height: markerSize * (80 / 120),
              borderRadius: (markerSize * (80 / 120)) / 2,
              backgroundColor: '#e0e0e0',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 15,
            }}
          >
            <Animated.Text
              style={{
                fontSize: markerSize * (54 / 120),
                color: '#888',
                fontWeight: 'bold',
                textAlign: 'center',
                textShadowColor: '#fff',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 6,
              }}
            >
              ?
            </Animated.Text>
          </View>
        ) : (
          <Image
            source={marker.coinImage
              ? { uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${marker.coinImage}` }
              : require('@/assets/images/14coin.png')
            }
            style={{ 
              width: markerSize * (100 / 120),
              height: markerSize * (100 / 120),
              resizeMode: 'contain',
              zIndex: 15,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MapMarkers({
  markers,
  collectedIds,
  loading,
  error,
  onMarkerPress,
  imageSize,
  containerSize,
}: MapMarkersProps) {
  if (loading || error) return null;

  // Define original image size (should match backend or static asset size)
  const originalImageWidth = 6250; // update if your map changes
  const originalImageHeight = 2572;

  return (
    <>
      {/* 📌 Markers */}
      {markers.map((m, i) => {
        // Always transform marker position using imageSize
        const markerX = m.x * (imageSize.width / originalImageWidth);
        const markerY = m.y * (imageSize.height / originalImageHeight);
        // Calculate marker size proportional to image size
        const markerBaseSize = 120; // px on original image
        const markerSize = markerBaseSize * (imageSize.width / originalImageWidth);
        const isCollected = collectedIds.includes(m._id);
        return (
          <MarkerItem
            key={m._id || i}
            marker={m}
            isCollected={isCollected}
            markerX={markerX}
            markerY={markerY}
            markerSize={markerSize}
            onPress={() => onMarkerPress(m)}
          />
        );
      })}
    </>
  );
}
