import React from 'react';
import { TouchableOpacity, ViewStyle, Image } from 'react-native';
import { apiRequest } from '@/utils/api';
export interface Marker {
  x: number;
  y: number;
  image: string;
  description: string;
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

export default function MapMarkers({ markers, collectedIds, loading, error, onMarkerPress }: MapMarkersProps) {
  if (loading || error) return null;

  return (
    <>
      {/* 📌 Markers */}
      {markers.map((m, i) => {
        const isCollected = collectedIds.includes(m._id);
        return (
          <TouchableOpacity
            key={m._id || i}
            style={[
              {
                position: 'absolute',
                width: 80,
                height: 80,
                zIndex: 5,
                top: m.y,
                left: m.x,
                justifyContent: 'center',
                alignItems: 'center',
              } as ViewStyle,
            ]}
            onPress={() => onMarkerPress(m)}
            activeOpacity={0.7}
          >
            <Image
              source={m.coinImage
                ? { uri: `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${m.coinImage}` }
                : require('@/assets/images/14coin.png')
              }
              style={[
                { width: 80, height: 80, resizeMode: 'contain' },
                !isCollected && { tintColor: 'gray', opacity: 0.8 }
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </>
  );
} 