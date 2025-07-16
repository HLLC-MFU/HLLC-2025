"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useCoinHunting from '@/hooks/useCoinHunting';
import TopBar from './_components/TopBar';
import InteractiveMap from './_components/InteractiveMap';
import MapMarkers from './_components/MapMarkers';
import MarkerDetailModal from './_components/MarkerDetailModal';
import CombinedModal from './_components/CombinedModal';
import StampModal from './_components/StampModal';

export default function CoinHuntingPageInner() {
  const {
    modal,
    selectedMarker,
    evoucher,
    alertType,
    stampCount,
    handleMarkerPress,
    handleCheckIn,
    handleGoToStamp,
    closeModal,
    markers,
    collectedIds,
    loadingMarkers,
    errorMarkers,
    collectedCoinImages,
    handleScannerSuccess,
    handleAlert,
  } = useCoinHunting();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [handledQuery, setHandledQuery] = useState(false);

  const handleScannerSuccessWithRefresh = useCallback((data?: any) => {
    handleScannerSuccess(data);
    setRefreshKey((k) => k + 1);
  }, [handleScannerSuccess]);

  useEffect(() => {
    if (handledQuery) return;
    const modalParam = searchParams.get('modal');
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    const allowedTypes = ['already-collected', 'no-evoucher', 'too-far', 'cooldown'] as const;
    if (modalParam === 'success') {
      handleScannerSuccessWithRefresh(code ? { code } : undefined);
      setHandledQuery(true);
      router.replace('/community/coin-hunting');
    } else if (
      modalParam === 'alert' &&
      type &&
      allowedTypes.includes(type as typeof allowedTypes[number])
    ) {
      handleAlert(type as typeof allowedTypes[number]);
      setHandledQuery(true);
      router.replace('/community/coin-hunting');
    }
  }, [searchParams, handleScannerSuccessWithRefresh, handleAlert, router, handledQuery]);

  // Helper for modal close to clear modal state and query
  const handleCloseModal = () => {
    closeModal();
    router.replace('/community/coin-hunting');
  };

  // Helper for Go to Stamp Page
  const handleGoToStampModal = () => {
    handleGoToStamp();
    router.replace('/community/coin-hunting');
  };

  // กำหนด initialCenter ให้อยู่ตรงกลางจอ (center pan)
  // ขนาดภาพ map: 6000x2469, initialScale: 0.5 (จาก InteractiveMap)
  const imageWidth = 6000;
  const imageHeight = 2469;
  const initialScale = 0.5;
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;
  // คำนวณให้ภาพอยู่ตรงกลางจอ
  const initialCenter = {
    x: (screenW - imageWidth * initialScale) / 2,
    y: (screenH - imageHeight * initialScale) / 2,
  };

  return (
    <div style={{ flex: 1, height: '100vh', backgroundColor: 'transparent' }}>
      <TopBar
        onScan={handleCheckIn}
        onStamp={handleGoToStampModal}
        centerText="Bloom possible"
      />
      <InteractiveMap initialCenter={initialCenter}>
        <MapMarkers
          markers={markers}
          collectedIds={collectedIds}
          loading={loadingMarkers}
          error={errorMarkers}
          onMarkerPress={handleMarkerPress}
        />
      </InteractiveMap>
      <MarkerDetailModal
        visible={modal === 'marker-detail'}
        marker={selectedMarker}
        onClose={closeModal}
        onCheckIn={handleCheckIn}
        isCheckedIn={!!(selectedMarker && collectedIds.includes(selectedMarker._id))}
      />
      <CombinedModal
        visible={modal === 'success'}
        type="success"
        onClose={handleCloseModal}
        onGoToStamp={handleGoToStampModal}
        evoucher={evoucher}
      />
      <CombinedModal
        visible={modal === 'alert'}
        type="alert"
        onClose={handleCloseModal}
        alertType={alertType as any}
      />
      <StampModal
        visible={modal === 'stamp'}
        onClose={handleCloseModal}
        coinImages={collectedCoinImages}
        coinRotations={[
          90, 140, 190, 240, 295, 345, 40,
          120, 165, 220, 270, 325, 15, 65,
        ]}
        coinSizes={[85, 85, 85, 90, 90, 85, 85, 85, 85, 90, 85, 90, 88, 85]}
      />
    </div>
  );
} 