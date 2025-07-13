import React, { useEffect } from 'react';
import { TouchableOpacity, ViewStyle, Image, View } from 'react-native';
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
}

export default function MapMarkers({
  markers,
  collectedIds,
  loading,
  error,
  onMarkerPress,
}: MapMarkersProps) {
  if (loading || error) return null;

  return (
    <>
      {/* 📌 Markers */}
      {markers.map((m, i) => {
        const isCollected = collectedIds.includes(m._id);
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

          return {
            opacity,
          };
        });

        const coinImageSource = m.coinImage
          ? { uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${m.coinImage}` }
          : require('@/assets/images/14coin.png');

        return (
          <TouchableOpacity
            key={m._id || i}
            style={[
              {
                position: 'absolute',
                width: 120,
                height: 120,
                zIndex: 5,
                top: m.y - 20,
                left: m.x - 20,
                justifyContent: 'center',
                alignItems: 'center',
              } as ViewStyle,
            ]}
            onPress={() => onMarkerPress(m)}
            activeOpacity={0.7}
          >
            {/* แสงด้านหลังหลัก */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderRadius: 80,
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
                  width: 130,
                  height: 130,
                  borderRadius: 65,
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
                  width: 100,
                  height: 100,
                  borderRadius: 50,
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
                  width: 110,
                  height: 110,
                  borderRadius: 55,
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
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#e0e0e0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 15,
                  }}
                >
                  <Animated.Text
                    style={{
                      fontSize: 54,
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
                  source={m.coinImage
                    ? { uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${m.coinImage}` }
                    : require('@/assets/images/14coin.png')
                  }
                  style={{ 
                    width: 100,
                    height: 100,
                    resizeMode: 'contain',
                    zIndex: 15,
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );
}
