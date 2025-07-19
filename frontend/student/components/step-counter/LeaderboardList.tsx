import React from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import styles from './styles';
import { Ranking } from '@/hooks/useStepLeaderboard';
import { Image } from 'expo-image';

interface Name {
  first: string;
  middle?: string;
  last?: string;
}

interface UserData {
  name: Name;
  stepCount: number;
  rank: number;
  isTeam?: boolean;
}

interface LeaderboardListProps {
  data: (Ranking & { rank?: number; completeStatus?: boolean })[] | Ranking[],
  valueLabel?: string;
}

const LeaderboardList = ({ data, valueLabel = 'steps' }: LeaderboardListProps) => (
  <FlatList
    data={data.slice(3)} // <-- only show users after top 3
    keyExtractor={(_, idx) => (idx + 4).toString()} // adjust key for correct rank
    contentContainerStyle={[styles.listContainer, { paddingBottom: 0 }]}
    renderItem={({ item, index }) => (
      <View style={[styles.cardItem]}>
        <View style={styles.cardRankCircle}>
          <Text style={styles.cardRankText}>{index + 4}</Text> {/* Start from rank 4 */}
        </View>
        <View style={{paddingRight: 10}}>
          {item.user.avatar ? (
            <Image
              source={{ uri: item.user.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {item.user.name.first.charAt(0)}
                {item.user.name.last?.charAt(0) || ''}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardName, { fontWeight: 'bold' }]}>
          {item.user.name.first} {item.user.name.last ? item.user.name.last.charAt(0) + '.' : ''}
        </Text>
        <Text style={styles.cardSteps}>{item.totalStep} {valueLabel}</Text>
      </View>
    )}
    showsVerticalScrollIndicator={false}
  />


);


export default LeaderboardList; 