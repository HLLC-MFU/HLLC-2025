import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Coins, Flower, Footprints } from 'lucide-react-native';
import GooeyFabMenu from '@/components/GooeyFabMenu';
import { useAppearance } from '@/hooks/useAppearance';
import useProfile from '@/hooks/useProfile';
import { useEffect } from 'react';


export default function HomeScreen() {
  const { user } = useProfile()
  const { assets, fetchAppearance } = useAppearance();

  useEffect(() => {
    if (user?.data[0].metadata.major.school._id) {
      fetchAppearance(user?.data[0].metadata.major.school._id);
    };
  }, [user?.data[0].metadata.major.school._id]);

  const subFabs = [
    {
      key: 'step',
      icon: <Footprints color={"white"} />,
      label: 'MILESDREAM',
      onPress: () => router.replace('/community/step-counter'),
    },
    {
      key: 'coin',
      icon: <Coins color={"white"} />,
      label: 'MISSIONS: BLOOMPOSSIBLE',
      onPress: () => router.replace('/community/coin-hunting'),
    },
    {
      key: 'lamduanflowers',
      icon: <Flower color={"white"} />,
      label: 'LAMDUAN FLOWER',
      onPress: () => router.replace('/lamduanflowers'),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
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
          assets={assets}
          subFabs={subFabs}
          style={{ top: -72, left: 16 }}
        />
      </SafeAreaView>
    </View>
  );
}
