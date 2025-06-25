import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import TopUser from './TopUser';
import LeaderboardList from './LeaderboardList';
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

interface CurrentUserData {
  name: Name;
  stepCount: number;
  rank: number;
  isLoading: boolean;
}

interface DynamicLeaderboardProps {
  users: any[];
  usersData: UserData[];
  currentUserData: CurrentUserData;
  getFullName: (name: Name) => string;
  width: number;
  height: number;
  cardNameStyle?: any;
}

const DynamicLeaderboard = ({
  users,
  usersData,
  currentUserData,
  getFullName,
  width,
  height,
  cardNameStyle = styles.cardName,
}: DynamicLeaderboardProps) => {
  return (
    <View style={{ width, flex: 1 }}>
      <View style={styles.top3Container}>
        {users[1] && (
          <TopUser
            rank={2}
            user={{ name: users[1].user?.name || { first: 'Unknown' }, stepCount: users[1].totalStep }}
            getFullName={getFullName}
          />
        )}
        {users[0] && (
          <TopUser
            rank={1}
            user={{ name: users[0].user?.name || { first: 'Unknown' }, stepCount: users[0].totalStep }}
            isMain
            getFullName={getFullName}
            crownImageSource={require('@/assets/images/crown3d.png')}
          />
        )}
        {users[2] && (
          <TopUser
            rank={3}
            user={{ name: users[2].user?.name || { first: 'Unknown' }, stepCount: users[2].totalStep }}
            getFullName={getFullName}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <LeaderboardList usersData={usersData.slice(0, 20)} getFullName={getFullName} />
        <View style={styles.cardContainer}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            marginHorizontal: width * 0.04,
            marginBottom: height * 0.00,
            bottom: 0,
            zIndex: 10,
          }}
        >
          <View
            style={[
              styles.cardMyteam,
              {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
            ]}
          >
            <View style={styles.cardRankCircle}>
              <Text style={styles.cardRankText}>
                {currentUserData.isLoading ? '...' : currentUserData.rank || 'N/A'}
              </Text>
            </View>
            <View style={styles.cardMyAvatar}>
              <Text style={{
                position: 'absolute',
                top: -10,
                right: -10,
                backgroundColor: '#FFD700',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: 8,
                paddingHorizontal: 6,
                fontSize: 12,
                zIndex: 20,
              }}>Me</Text>
            </View>
            <Text style={styles.cardMyName}>
              {currentUserData.isLoading ? 'Loading...' : currentUserData.name.first + ' ' + currentUserData.name.last}
            </Text>
            <Text style={styles.cardSteps}>
              {currentUserData.isLoading ? '...' : `${currentUserData.stepCount} steps`}
            </Text>
          </View>
        </View>
        </View>
      </View>
    </View>
  );
};

export default DynamicLeaderboard; 