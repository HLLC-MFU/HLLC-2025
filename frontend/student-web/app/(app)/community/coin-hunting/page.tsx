'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useCoinHunting from '@/hooks/useCoinHunting';
import TopBar from './_components/TopBar';
import InteractiveMap from './_components/InteractiveMap';
import MapMarkers from './_components/MapMarkers';
import MarkerDetailModal from './_components/MarkerDetailModal';
import CombinedModal from './_components/CombinedModal';
import StampModal from './_components/StampModal';

export default function CoinHuntingPage() {
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

  const handleScannerSuccessWithRefresh = useCallback((data?: any) => {
    handleScannerSuccess(data);
    setRefreshKey((k) => k + 1);
  }, [handleScannerSuccess]);

  useEffect(() => {
    const modalParam = searchParams.get('modal');
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    const allowedTypes = ['already-collected', 'no-evoucher', 'too-far'] as const;
    if (modalParam === 'success') {
      handleScannerSuccessWithRefresh(code ? { code } : undefined);
      router.replace('/coin-hunting');
    } else if (
      modalParam === 'alert' &&
      type &&
      allowedTypes.includes(type as typeof allowedTypes[number])
    ) {
      handleAlert(type as typeof allowedTypes[number]);
      router.replace('/coin-hunting');
    }
  }, [searchParams, handleScannerSuccessWithRefresh]);

  return (
    <div style={{ flex: 1, height: '100vh', backgroundColor: 'transparent' }}>
      <TopBar
        onScan={handleCheckIn}
        onStamp={handleGoToStamp}
        centerText="Bloom possible"
      />
      <InteractiveMap>
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
      />
      <CombinedModal
        visible={modal === 'success'}
        type="success"
        onClose={closeModal}
        onGoToStamp={handleGoToStamp}
        evoucher={evoucher}
      />
      <CombinedModal
        visible={modal === 'alert'}
        type="alert"
        onClose={closeModal}
        alertType={alertType ?? undefined}
      />
      <StampModal
        visible={modal === 'stamp'}
        onClose={closeModal}
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
