'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import TopBar from './_components/TopBar';
import InteractiveMap from './_components/InteractiveMap';
import MapMarkers from './_components/MapMarkers';
import MarkerDetailModal from './_components/MarkerDetailModal';
import CombinedModal from './_components/CombinedModal';
import StampModal from './_components/StampModal';

import useCoinHunting from '@/hooks/useCoinHunting';

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

  const handleScannerSuccessWithRefresh = useCallback(
    (data?: any) => {
      handleScannerSuccess(data);
      setRefreshKey(k => k + 1);
    },
    [handleScannerSuccess],
  );

  useEffect(() => {
    const modalParam = searchParams.get('modal');
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    const allowedTypes = [
      'already-collected',
      'no-evoucher',
      'too-far',
    ] as const;

    if (modalParam === 'success') {
      handleScannerSuccessWithRefresh(code ? { code } : undefined);
      router.replace('/coin-hunting');
    } else if (
      modalParam === 'alert' &&
      type &&
      allowedTypes.includes(type as (typeof allowedTypes)[number])
    ) {
      handleAlert(type as (typeof allowedTypes)[number]);
      router.replace('/coin-hunting');
    }
  }, [searchParams, handleScannerSuccessWithRefresh]);

  return (
    <div style={{ flex: 1, height: '100vh', backgroundColor: 'transparent' }}>
      <TopBar
        centerText="Bloom possible"
        onScan={handleCheckIn}
        onStamp={handleGoToStamp}
      />
      <InteractiveMap>
        <MapMarkers
          collectedIds={collectedIds}
          error={errorMarkers}
          loading={loadingMarkers}
          markers={markers}
          onMarkerPress={handleMarkerPress}
        />
      </InteractiveMap>
      <MarkerDetailModal
        marker={selectedMarker}
        visible={modal === 'marker-detail'}
        onCheckIn={handleCheckIn}
        onClose={closeModal}
      />
      <CombinedModal
        evoucher={evoucher}
        type="success"
        visible={modal === 'success'}
        onClose={closeModal}
        onGoToStamp={handleGoToStamp}
      />
      <CombinedModal
        alertType={alertType ?? undefined}
        type="alert"
        visible={modal === 'alert'}
        onClose={closeModal}
      />
      <StampModal
        coinImages={collectedCoinImages}
        coinRotations={[
          90, 140, 190, 240, 295, 345, 40, 120, 165, 220, 270, 325, 15, 65,
        ]}
        coinSizes={[85, 85, 85, 90, 90, 85, 85, 85, 85, 90, 85, 90, 88, 85]}
        visible={modal === 'stamp'}
        onClose={closeModal}
      />
    </div>
  );
}
