
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/utils/api';
import { Marker, MapApiResponse, LandmarkApiItem, LandmarkApiResponse, CoinCollectionLandmark, CoinCollectionApiItem, CoinCollectionApiResponse } from '@/types/coinHunting';
import { useProfile } from './useProfile';

const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 640;

type ModalType = null | 'scanner' | 'success' | 'alert' | 'stamp' | 'marker-detail';

export default function useCoinHunting() {
  const [state, setState] = useState({
    modal: null as ModalType,
    selectedMarker: null as Marker | null,
    evoucher: null as { code: string } | null,
    alertType: null as 'already-collected' | 'no-evoucher' | 'too-far' | 'cooldown' | null,
  });

  const [uiState, setUiState] = useState({
    imageSize: { width: 1, height: 1 },
    minScale: 1,
    imageUrl: null as string | null,
    error: null as string | null,
    stampCount: 0,
    scanning: false,
    collectedCoinImages: [] as (string | undefined)[],
  });

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [loadingMarkers, setLoadingMarkers] = useState(true);
  const [errorMarkers, setErrorMarkers] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [cooldownMs, setCooldownMs] = useState<number | null>(null);

  const router = useRouter();
  const { user } = useProfile();

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest<MapApiResponse>('/maps');
        const maps = Array.isArray(res.data?.data) ? res.data.data : [];
        if (maps.length > 0) {
          const url = `${process.env.NEXT_PUBLIC_API_URL?.trim()}/uploads/${maps[0].map}`;
          const img = new window.Image();
          img.onload = () => {
            const scaleW = screenWidth / img.width;
            const scaleH = screenHeight / img.height;
            const min = Math.max(scaleW, scaleH);
            setUiState(s => ({
              ...s,
              imageUrl: url,
              imageSize: { width: img.width, height: img.height },
              minScale: min,
              error: null,
            }));
          };
          img.onerror = () => {
            setUiState(s => ({ ...s, error: 'Failed to load map image.' }));
          };
          img.src = url;
        } else {
          setUiState(s => ({ ...s, error: 'No map data found.' }));
        }
      } catch {
        setUiState(s => ({ ...s, error: 'An error occurred while loading the map.' }));
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingMarkers(true);
      setErrorMarkers(null);
      try {
        const [landmarksRes, collectionsRes] = await Promise.all([
          apiRequest<LandmarkApiResponse>('/landmarks?page=1&limit=30'),
          apiRequest<CoinCollectionApiResponse>('/coin-collections/my-coin'),
        ]);

        if (Array.isArray(landmarksRes.data?.data)) {
          const mapped = landmarksRes.data.data.map((item: LandmarkApiItem) => ({
            x: item.mapCoordinates?.x ?? 0,
            y: item.mapCoordinates?.y ?? 0,
            image: item.hintImage
              ? `${process.env.NEXT_PUBLIC_API_URL?.trim()}/uploads/${item.hintImage}`
              : '',
            description: {
              th: item.hint?.th || '',
              en: item.hint?.en || '',
            },
            mapsUrl: item.location?.mapUrl || '',
            _id: item._id,
            coinImage: item.coinImage,
          }));
          if (mounted) setMarkers(mapped);
        } else if (mounted) setErrorMarkers('No data');

        if (Array.isArray(collectionsRes.data?.data)) {
          const allLandmarks = collectionsRes.data.data.flatMap((c: CoinCollectionApiItem) => c.landmarks || []);
          const ids = allLandmarks.map((l: CoinCollectionLandmark) => l.landmark?._id).filter(Boolean) as string[];
          if (mounted) setCollectedIds(ids);
        }
      } catch (e: any) {
        if (mounted) setErrorMarkers(e.message || 'Error fetching landmarks');
      } finally {
        if (mounted) setLoadingMarkers(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (state.modal === 'stamp') {
      const fetchStamps = async () => {
        try {
          const res = await apiRequest<CoinCollectionApiResponse>('/coin-collections/my-coin');
          const dataArr = Array.isArray(res?.data?.data) ? res.data.data : [];
          const landmarks = dataArr[0]?.landmarks || [];
          const NUM_SLOTS = 21;
          const imagesByOrder: (string | undefined)[] = Array(NUM_SLOTS).fill(undefined);
          landmarks.forEach((l: CoinCollectionLandmark) => {
            const order = l.landmark?.order;
            if (order && order >= 1 && order <= NUM_SLOTS && l.landmark?.coinImage) {
              imagesByOrder[order - 1] = `${process.env.NEXT_PUBLIC_API_URL?.trim()}/uploads/${l.landmark.coinImage}`;
            }
          });
          setUiState(s => ({ ...s, stampCount: landmarks.length, collectedCoinImages: imagesByOrder }));
        } catch {
          setUiState(s => ({ ...s, stampCount: 0, collectedCoinImages: [] }));
        }
      };
      fetchStamps();
    }
  }, [state.modal, collectedIds]);

  const handleMarkerPress = (marker: Marker) => {
    setState(s => ({ ...s, selectedMarker: marker, modal: 'marker-detail' }));
  };

  const handleCheckIn = () => {
    setState(s => ({ ...s, modal: 'scanner', selectedMarker: null }));
  };

  const handleScannerSuccess = (evoucherData?: { code: string } | null) => {
    setState(s => ({ ...s, evoucher: evoucherData || null, modal: 'success' }));
    setRefreshKey(k => k + 1);
  };

  const handleGoToStamp = () => {
    setState(s => ({ ...s, evoucher: null, modal: 'stamp' }));
  };

  const handleAlert = (type: 'already-collected' | 'no-evoucher' | 'too-far' | 'cooldown', ms?: number) => {
    setState(s => ({ ...s, alertType: type, modal: 'alert' }));
    if (type === 'cooldown' && typeof ms === 'number') setCooldownMs(ms);
    else setCooldownMs(null);
  };

  const closeModal = () => setState(s => ({ ...s, modal: null }));

  const setScanning = (scanning: boolean) => {
    setUiState(s => ({ ...s, scanning }));
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(value, max));
  };

  return {
    imageSize: uiState.imageSize,
    minScale: uiState.minScale,
    imageUrl: uiState.imageUrl,
    error: uiState.error,
    modal: state.modal,
    selectedMarker: state.selectedMarker,
    evoucher: state.evoucher,
    alertType: state.alertType,
    stampCount: uiState.stampCount,
    scanning: uiState.scanning,
    setScanning,
    permission: null,
    requestPermission: () => {},
    router,
    user,
    markers,
    collectedIds,
    loadingMarkers,
    errorMarkers,
    clamp,
    collectedCoinImages: uiState.collectedCoinImages,
    handleMarkerPress,
    handleCheckIn,
    handleScannerSuccess,
    handleGoToStamp,
    handleAlert,
    closeModal,
    setState,
    cooldownMs,
  };
}
