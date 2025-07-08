import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import SegmentedToggle from '@/components/step-counter/SegmentedToggle';
import { useState } from 'react';
import DynamicLeaderboard from './DynamicLeaderboard';

type Props = {
  individualStepCounter: IndividualStepCounterResponse,
  loading: boolean,
}

export default function LeaderBoard({ individualStepCounter, loading }: Props) {
  const [selectedTab, setSelectedTab] = useState(0);

  const getFullName = (name: { first: string; middle?: string; last?: string }) => {
    return [name.first, name.middle, name.last].filter(Boolean).join(' ');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SegmentedToggle value={selectedTab} onChange={setSelectedTab} />
      <View style={styles.contentContainer}>
        {selectedTab === 0 && (
          <View style={styles.page}>
            <DynamicLeaderboard
              users={individualStepCounter}
              currentUserData={individualStepCounter?.myRank || undefined}
            />
          </View>
        )}
        {selectedTab === 1 && (
          <View style={styles.page}>
            <Text style={styles.text}>School/Group Leaderboard</Text>
          </View>
        )}
        {selectedTab === 2 && (
          <View style={styles.page}>
            <Text style={styles.text}>Achievement Leaderboard</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
