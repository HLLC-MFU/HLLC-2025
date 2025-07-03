import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import InteractiveMap from './_components/interactive-map';
import MapMarkers from './_components/map-markers';
import MarkerDetailModal from './_components/marker-detail-modal';
import SuccessModal from './_components/success-modal';
import AlertModal from './_components/alert-modal';
import TopBar from './_components/top-bar';
import StampModal from './_components/stamp-modal';
import useCoinHunting from '@/hooks/useCoinHunting';
import { useRouter } from 'expo-router';

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

  return (
    <GestureHandlerRootView style={styles.container}>
      <TopBar
        onScan={handleCheckIn}
        onStamp={() => handleGoToStamp()}
        centerText="Bloom possible"
        onLeaderboard={() => router.replace('/(app)/coin-hunting/leaderboard')}
      />
      <InteractiveMap>
        <MapMarkers onMarkerPress={handleMarkerPress} />
      </InteractiveMap>
      <MarkerDetailModal
        visible={modal === 'marker-detail'}
        marker={selectedMarker}
        onClose={closeModal}
        onCheckIn={handleCheckIn}
      />
      <SuccessModal
        visible={modal === 'success'}
        onClose={closeModal}
        onGoToStamp={handleGoToStamp}
        evoucher={evoucher}
      />
      <AlertModal
        visible={modal === 'alert'}
        alertType={alertType}
        onClose={closeModal}
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
