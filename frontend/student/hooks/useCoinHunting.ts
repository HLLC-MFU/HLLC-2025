import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { apiRequest } from '@/utils/api';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import useProfile from '@/hooks/useProfile';
import { Dimensions } from 'react-native';

const screen = Dimensions.get('window');

const markers = [
  {
    x: 600,
    y: 1100,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    description:
      'ใต้ถุนอาคาร E2 ประกอบด้วยร้านอาหาร 8 ร้าน ร้านอาหารว่างและเครื่องดื่ม 3 ร้าน เปิดบริการตั้งแต่เวลา 07.00 - 18.00 น.ทุกวัน ด้วยความจุ 350 ที่นั่ง สามารถรองรับผู้ใช้บริการได้กว่า 1,500 คนต่อวัน',
    mapsUrl: 'https://maps.app.goo.gl/FUoQPiJTsr6rQHAQA?g_st=ipc',
  },
  {
    x: 900,
    y: 400,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    description:
      'ใต้ถุนอาคาร E2 ประกอบด้วยร้านอาหาร 8 ร้าน ร้านอาหารว่างและเครื่องดื่ม 3 ร้าน เปิดบริการตั้งแต่เวลา 07.00 - 18.00 น.ทุกวัน ด้วยความจุ 350 ที่นั่ง สามารถรองรับผู้ใช้บริการได้กว่า 1,500 คนต่อวัน',
    mapsUrl: 'https://maps.app.goo.gl/FUoQPiJTsr6rQHAQA?g_st=ipc',
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

type ModalType = null | 'scanner' | 'success' | 'alert' | 'stamp' | 'marker-detail';

export default function useCoinHunting() {
  // รวม modal state, selected marker, evoucher, alertType ไว้ใน object เดียว
  const [state, setState] = useState<{
    modal: ModalType;
    selectedMarker: (typeof markers)[0] | null;
    evoucher: { code: string } | null;
    alertType: "already-collected" | "no-evoucher" | "too-far" | null;
  }>({
    modal: null,
    selectedMarker: null,
    evoucher: null,
    alertType: null,
  });

  // รวม UI state ที่เกี่ยวข้องไว้ใน object เดียว
  const [uiState, setUiState] = useState({
    imageSize: { width: 1, height: 1 },
    minScale: 1,
    imageUrl: null as string | null,
    error: null as string | null,
    stampCount: 0,
    scanning: false,
    collectedCoinImages: [] as (string | undefined)[],
  });

  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const { user } = useProfile();

  // Fetch map image
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest<any>('/maps');
        const maps = res.data?.data || [];
        if (maps.length > 0) {
          const url = `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${maps[0].map}`;
          Image.getSize(
            url,
            (w, h) => {
              const scaleW = screen.width / w;
              const scaleH = screen.height / h;
              const min = Math.max(scaleW, scaleH);
              setUiState(s => ({
                ...s,
                imageUrl: url,
                imageSize: { width: w, height: h },
                minScale: min,
                error: null,
              }));
            },
            err => {
              setUiState(s => ({ ...s, error: 'Failed to load map image.' }));
            },
          );
        } else {
          setUiState(s => ({ ...s, error: 'No map data found.' }));
        }
      } catch (e) {
        setUiState(s => ({ ...s, error: 'An error occurred while loading the map.' }));
      }
    })();
  }, []);

  // Fetch stamp count and coin images when open stamp modal
  useEffect(() => {
    if (state.modal === 'stamp') {
      const fetchStamps = async () => {
        try {
          const res = await apiRequest('/coin-collections') as { data?: { data?: { landmarks?: any[] }[] } };
          const landmarks = res?.data?.data?.[0]?.landmarks || [];
          const NUM_SLOTS = 14;
          const imagesByOrder: (string | undefined)[] = Array(NUM_SLOTS).fill(undefined);
          landmarks.forEach((l: any) => {
            const order = l.landmark?.order;
            if (order && order >= 1 && order <= NUM_SLOTS && l.landmark?.coinImage) {
              imagesByOrder[order - 1] = `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${l.landmark.coinImage}`;
            }
          });
          setUiState(s => ({ ...s, stampCount: landmarks.length, collectedCoinImages: imagesByOrder }));
        } catch (e) {
          setUiState(s => ({ ...s, stampCount: 0, collectedCoinImages: [] }));
        }
      };
      fetchStamps();
    }
  }, [state.modal]);

  // Handlers
  const handleMarkerPress = (marker: typeof markers[0]) => {
    setState(s => ({ ...s, selectedMarker: marker, modal: 'marker-detail' }));
  };

  const handleCheckIn = () => {
    setState(s => ({ ...s, modal: 'scanner', selectedMarker: null }));
  };

  const handleScannerSuccess = (evoucherData?: { code: string } | null) => {
    setState(s => ({ ...s, evoucher: evoucherData || null, modal: 'success' }));
  };

  const handleGoToStamp = () => {
    setState(s => ({ ...s, evoucher: null, modal: 'stamp' }));
  };

  const handleAlert = (type: "already-collected" | "no-evoucher" | "too-far") => {
    setState(s => ({ ...s, alertType: type, modal: 'alert' }));
  };

  const closeModal = () => setState(s => ({ ...s, modal: null }));

  // เพิ่ม setter สำหรับ scanning
  const setScanning = (scanning: boolean) => {
    setUiState(s => ({ ...s, scanning }));
  };

  return {
    // map image
    imageSize: uiState.imageSize,
    minScale: uiState.minScale,
    imageUrl: uiState.imageUrl,
    error: uiState.error,
    // modal/logic state
    modal: state.modal,
    selectedMarker: state.selectedMarker,
    evoucher: state.evoucher,
    alertType: state.alertType,
    stampCount: uiState.stampCount,
    scanning: uiState.scanning,
    setScanning,
    permission,
    requestPermission,
    router,
    user,
    markers,
    clamp,
    collectedCoinImages: uiState.collectedCoinImages,
    // handlers
    handleMarkerPress,
    handleCheckIn,
    handleScannerSuccess,
    handleGoToStamp,
    handleAlert,
    closeModal,
    setState, // เผื่ออยาก set อะไรเอง
  };
} 