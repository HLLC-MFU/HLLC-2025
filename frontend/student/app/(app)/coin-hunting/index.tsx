import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import useCoinHunting from '@/hooks/useCoinHunting';
import { useRouter } from 'expo-router';
import TopBar from '@/components/coin-hunting/top-bar';
import InteractiveMap from '@/components/coin-hunting/interactive-map';
import MapMarkers from '@/components/coin-hunting/map-markers';
import MarkerDetailModal from '@/components/coin-hunting/marker-detail-modal';
import SuccessModal from '@/components/coin-hunting/success-modal';
import AlertModal from '@/components/coin-hunting/alert-modal';
import StampModal from '@/components/coin-hunting/stamp-modal';

export default function CoinHuntingScreen() {
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
