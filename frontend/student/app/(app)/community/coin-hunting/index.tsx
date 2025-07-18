import  { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useCoinHunting from '@/hooks/useCoinHunting';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TopBar from '@/components/coin-hunting/top-bar';
import InteractiveMap from '@/components/coin-hunting/interactive-map';
import MapMarkers from '@/components/coin-hunting/map-markers';
import MarkerDetailModal from '@/components/coin-hunting/marker-detail-modal';
import CombinedModal from '@/components/coin-hunting/combined-modal';
import StampModal from '@/components/coin-hunting/stamp-modal';


export default function CoinHuntingScreen() {
  const {
    modal,
    selectedMarker,
    evoucher,
    alertType,
    remainingCooldownMs,
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
  const params = useLocalSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScannerSuccessWithRefresh = useCallback((data?: any) => {
    handleScannerSuccess(data);
    setRefreshKey((k) => k + 1);
  }, [handleScannerSuccess]);

  useEffect(() => {
    if (params.modal === 'success') {
      handleScannerSuccessWithRefresh(params.code ? { code: params.code as string } : undefined);
      router.replace('/community/coin-hunting');
    } else if (params.modal === 'alert' && params.type) {
      handleAlert(params.type as any, params.remainingCooldownMs ? Number(params.remainingCooldownMs) : undefined);
      router.replace('/community/coin-hunting');
    }
  }, [params.modal, params.type, params.code, params.remainingCooldownMs, handleScannerSuccessWithRefresh]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <TopBar
        onScan={handleCheckIn}
        onStamp={() => handleGoToStamp()}
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
        collectedIds={collectedIds}
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
        remainingCooldownMs={remainingCooldownMs}
      />
      <StampModal
        visible={modal === 'stamp'}
        onClose={closeModal}
        stamps={stampCount}
        onGetReward={() => {}}
        coinImages={collectedCoinImages}
        coinRotations={[
          90, 140, 190, 240, 295, 345, 40, // รอบนอก
          120, 165, 220, 270, 325, 15, 65 // รอบใน
        ]}
        coinSizes={[ 85, 85, 85 , 90, 90, 85, 85, 85, 85, 90, 85, 90, 88, 85]}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
