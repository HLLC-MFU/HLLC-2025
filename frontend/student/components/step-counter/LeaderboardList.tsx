import React from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import styles from './styles';

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
  usersData: UserData[];
  getFullName: (name: Name) => string;
}

const { width } = Dimensions.get('window');

const LeaderboardList = ({ usersData, getFullName }:LeaderboardListProps) => (
  <FlatList
    data={usersData}
    keyExtractor={(_, idx) => idx.toString()}
    contentContainerStyle={[styles.listContainer, { paddingBottom: width * 0.08 }]}
    renderItem={({ item }) => (
      <View
        style={[
          styles.cardItem,
          item.isTeam && {
            backgroundColor: 'rgba(255,255,255,0.13)',
            borderWidth: 2,
            borderColor: '#FFD700',
          },
        ]}
      >
        <View style={styles.cardRankCircle}>
          <Text style={styles.cardRankText}>{item.rank}</Text>
        </View>
        <View style={styles.cardAvatar}>

        </View>
        <Text style={[styles.cardName, item.isTeam && { fontWeight: 'bold' }]}> 
          {item.isTeam
            ? item.name.first + ' ' + item.name.last
            : getFullName(item.name)}
        </Text>
        <Text style={styles.cardSteps}>{item.stepCount} steps</Text>
      </View>
    )}
    showsVerticalScrollIndicator={false}
  />
);

export default LeaderboardList; 