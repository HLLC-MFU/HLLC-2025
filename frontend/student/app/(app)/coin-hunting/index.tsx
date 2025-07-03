import  { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import InteractiveMap from './_components/interactive-map';
import MapMarkers from './_components/map-markers';
import MarkerDetailModal from './_components/marker-detail-modal';
import TopBar from './_components/top-bar';
import StampModal from './_components/stamp-modal';
import useCoinHunting from '@/hooks/useCoinHunting';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CombinedModal from './_components/combined-modal';

export default function CoinHuntingScreen() {
  const {
    modal,
    selectedMarker,
    evoucher,
    alertType,
    stampCount,
    handleMarkerPress,
    handleCheckIn,
    handleScannerSuccess,
    handleGoToStamp,
    handleAlert,
    closeModal,
    markers,
    collectedCoinImages,
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
      router.replace('/coin-hunting');
    } else if (params.modal === 'alert' && params.type) {
      handleAlert(params.type as any);
      router.replace('/coin-hunting');
    }
  }, [params.modal, params.type, params.code, handleScannerSuccessWithRefresh]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <TopBar
        onScan={handleCheckIn}
        onStamp={() => handleGoToStamp()}
        centerText="Bloom possible"
        onLeaderboard={() => router.replace('/coin-hunting/leaderboard')}
      />
      <InteractiveMap>
        <MapMarkers onMarkerPress={handleMarkerPress} refreshKey={refreshKey} />
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
        stamps={stampCount}
        onGetReward={() => {}}
        coinImages={collectedCoinImages}
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
