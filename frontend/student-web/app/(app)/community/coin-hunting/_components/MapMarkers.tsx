
'use client';

import React, { useEffect } from 'react';
import { useSpring, animated, useSprings } from '@react-spring/web';

export interface Marker {
  x: number;
  y: number;
  image: string;
  description: any;
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
  const springs = useSprings(
    markers.length,
    markers.map((m) => {
      const isCollected = collectedIds.includes(m._id);
      return {
        from: { opacity: 0.3 },
        to: async (next: any) => {
          while (true) {
            await next({ opacity: isCollected ? 0.4 : 0.2 });
            await next({ opacity: isCollected ? 0.1 : 0.05 });
          }
        },
        config: { duration: isCollected ? 2000 : 3000 },
        reset: true,
      };
    })
  );

  if (loading || error) return null;

  return (
    <>
      {markers.map((m, i) => {
        const isCollected = collectedIds.includes(m._id);
        const glowStyle = springs[i];

        return (
          <div
            key={m._id || i}
            className="absolute cursor-pointer select-none"
            style={{
              top: m.y - 20,
              left: m.x - 20,
              width: 120,
              height: 120,
              zIndex: 50,
              touchAction: 'manipulation',
            }}
            onClick={() => onMarkerPress(m)}
            onTouchEnd={e => {
              e.stopPropagation();
              onMarkerPress(m);
            }}
          >
            {/* Glow Effects */}
            {[160, 130, 100].map((size, index) => (
              <animated.div
                key={index}
                style={{
                  ...glowStyle,
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: isCollected
                    ? 'rgba(255, 215, 0, 0.15)'
                    : 'rgba(128, 128, 128, 0.1)',
                  boxShadow: `0 0 ${20 - index * 5}px ${
                    isCollected ? '#FFD700' : '#808080'
                  }`,
                }}
              />
            ))}

            {/* Foreground - coin or question mark */}
            <div
              style={{
                position: 'absolute',
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: !isCollected ? 'rgba(255,255,255,0.35)' : 'transparent',
                border: !isCollected ? '3px solid white' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              {!isCollected ? (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 54,
                      color: '#888',
                      fontWeight: 'bold',
                      textShadow: '0 0 6px #fff',
                    }}
                  >
                    ?
                  </span>
                </div>
              ) : (
                <img
                  src={
                    m.coinImage
                      ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${m.coinImage}`
                      : '/images/14coin.png'
                  }
                  alt="coin"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: 'contain',
                    zIndex: 15,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
