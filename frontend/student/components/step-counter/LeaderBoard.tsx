import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import SegmentedToggle from '@/components/step-counter/SegmentedToggle';
import { useState } from 'react';
import { Spinner } from 'tamagui';
import { LeaderboardData } from '@/hooks/useStepLeaderboard';
import DynamicLeaderboard from './DynamicLeaderboard';
import chatStyles from '@/constants/chats/chatStyles';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

type Props = {
  data: LeaderboardData | null;
  loading: boolean,
}

export default function LeaderBoard({ data, loading }: Props) {
  const [selectedTab, setSelectedTab] = useState(0);


  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}><Spinner /></Text>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>No data available</Text>
      </View>
    );
  }

  return (<>
    <TouchableOpacity
      style={[chatStyles.backButton, { position: 'absolute', top: 20, left: 20 }]}
      onPress={() => router.replace('/(app)')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <ChevronLeft color="#fff" size={24} />
    </TouchableOpacity>
    <SafeAreaView style={styles.container}>

      <SegmentedToggle value={selectedTab} onChange={setSelectedTab} />
      <View style={styles.contentContainer}>
        {selectedTab === 0 && (
          <View style={styles.page}>
            <DynamicLeaderboard
              data={data.individualRank}
              currentUserData={
                data.myRank ? {
                  rank: data.myRank.individualRank,
                  totalStep: data.myRank.totalStep,
                } : {}
              }
            />
          </View>
        )}
        {selectedTab === 1 && (
          <View style={styles.page}>
            <DynamicLeaderboard
              data={data.schoolRank || []}
              currentUserData={
                data.myRank ? {
                  rank: data.myRank.schoolRank,
                  totalStep: data.myRank.totalStep,
                } : {}
              }
            />
          </View>
        )}
        {selectedTab === 2 && (
          <View style={styles.page}>
            <DynamicLeaderboard
              data={data.archeivementRank || []}
              currentUserData={
                data.myRank ? {
                  rank: data.myRank.archeivementRank,
                  totalStep: data.myRank.totalStep,
                } : {}
              }
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  </>
  );

}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 80,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  page: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});
