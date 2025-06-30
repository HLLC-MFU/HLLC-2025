import React, { useEffect, useState } from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { apiRequest } from '@/utils/api';

interface Marker {
  x: number;
  y: number;
  image: string;
  description: string;
  mapsUrl: string;
  _id: string;
}

interface MapMarkersProps {
  onMarkerPress: (marker: Marker) => void;
}

export default function MapMarkers({ onMarkerPress }: MapMarkersProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      const url = `${process.env.EXPO_PUBLIC_API_URL?.trim()}/landmarks`;
      try {
        const res = await apiRequest<any>('/landmarks');
        if (res.data && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((item: any) => ({
            x: item.mapCoordinates?.x ?? 0,
            y: item.mapCoordinates?.y ?? 0,
            image: item.hintImage
              ? `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${item.hintImage}`
              : '',
            description: item.hint?.th || item.hint?.en || '',
            mapsUrl: item.location?.mapUrl || '',
            _id: item._id,
          }));
          if (mounted) {
            setMarkers(mapped);
          }
        } else {
          if (mounted) setError('No data');
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
      {markers.map((m, i) => (
        <TouchableOpacity
          key={m._id || i}
          style={[
            {
              position: 'absolute',
              width: 80,
              height: 80,
              backgroundColor: 'rgba(255,0,0,0.5)',
              borderRadius: 40,
              borderWidth: 2,
              borderColor: '#fff',
              zIndex: 5,
              top: m.y,
              left: m.x,
            } as ViewStyle,
          ]}
          onPress={() => onMarkerPress(m)}
          activeOpacity={0.7}
        />
      ))}
    </>
  );
} 