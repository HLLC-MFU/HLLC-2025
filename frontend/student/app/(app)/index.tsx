import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Coins, Flower, Footprints } from 'lucide-react-native';
import { useEffect } from 'react';
import { registerBackgroundTaskAsync, syncStepsOnStartup } from '@/hooks/health/useStepCollect';
import GooeyFabMenu from '@/components/GooeyFabMenu';


export default function HomeScreen() {
  useEffect(() => {
    async function setupBackgroundTask() {
      try {
        await registerBackgroundTaskAsync();
        await syncStepsOnStartup();
      } catch (e) {
      }
    }

    setupBackgroundTask();
  }, []);

  const subFabs = [
    {
      key: 'step',
      icon: <Footprints color={"white"} />,
      label: 'Step',
      onPress: () => router.replace('/community/step-counter'),
    },
    {
      key: 'coin',
      icon: <Coins color={"white"} />,
      label: 'Coin',
      onPress: () => router.replace('/coin-hunting'),
    },
    {
      key: 'lamduanflowers',
      icon: <Flower color={"white"} />,
      label: 'lamduanflowers',
      onPress: () => router.replace('/lamduanflowers'),
    },
  ];

  const content = (
    <SafeAreaView
      style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <GooeyFabMenu
        subFabs={subFabs}
        style={{ top: -24, left: 16 }}
      />
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1 }}>
      {content}
    </View>
  );
}
