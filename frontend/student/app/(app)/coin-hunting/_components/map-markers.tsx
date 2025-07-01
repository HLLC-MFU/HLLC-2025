import React, { useEffect, useState } from 'react';
import { TouchableOpacity, ViewStyle, Image, View } from 'react-native';
import { apiRequest } from '@/utils/api';
import { BlurView } from 'expo-blur';

interface Marker {
  x: number;
  y: number;
  image: string;
  description: string;
  mapsUrl: string;
  _id: string;
  coinImage?: string;
}

interface MapMarkersProps {
  onMarkerPress: (marker: Marker) => void;
}

export default function MapMarkers({ onMarkerPress }: MapMarkersProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [landmarksRes, collectionsRes] = await Promise.all([
          apiRequest<any>('/landmarks'),
          apiRequest<any>('/coin-collections'),
        ]);
        if (landmarksRes.data && Array.isArray(landmarksRes.data.data)) {
          const mapped = landmarksRes.data.data.map((item: any) => ({
            x: item.mapCoordinates?.x ?? 0,
            y: item.mapCoordinates?.y ?? 0,
            image: item.hintImage
              ? `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${item.hintImage}`
              : '',
            description: item.hint?.th || item.hint?.en || '',
            mapsUrl: item.location?.mapUrl || '',
            _id: item._id,
            coinImage: item.coinImage,
          }));
          if (mounted) {
            setMarkers(mapped);
          }
        } else {
          if (mounted) setError('No data');
        }
        // Extract collected landmark ids
        if (collectionsRes.data && Array.isArray(collectionsRes.data.data)) {
          const allLandmarks = collectionsRes.data.data.flatMap((c: any) => c.landmarks || []);
          const ids = allLandmarks.map((l: any) => l.landmark?._id).filter(Boolean);
          if (mounted) setCollectedIds(ids);
        }
      } catch (e: any) {
        if (mounted) setError(e.message || 'Error fetching landmarks');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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