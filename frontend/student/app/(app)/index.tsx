import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Coins, Flower, Footprints } from 'lucide-react-native';
import GooeyFabMenu from '@/components/GooeyFabMenu';
import PretestModal from '@/components/prepost-modal/PretestModal';
import PosttestModal from '@/components/prepost-modal/PosttestModal';
import usePrePostModal from '@/hooks/usePrePostModal';


export default function HomeScreen() {


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
      onPress: () => router.replace('/community/coin-hunting'),
    },
    {
    key: 'lamduanflowers',
    icon: <Flower color={"white"} />,
    label: 'lamduanflowers',
    onPress: () => router.replace('/lamduanflowers'),
  },
];

  // Pretest modal hook
  const {
    modalVisible: pretestVisible,
    questions: pretestQuestions,
    loading: pretestLoading,
    error: pretestError,
    submit: submitPretest,
  } = usePrePostModal({ type: 'pretest' });

  // Posttest modal hook
  const {
    modalVisible: posttestVisible,
    questions: posttestQuestions,
    loading: posttestLoading,
    error: posttestError,
    submit: submitPosttest,
  } = usePrePostModal({ type: 'posttest' });

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
